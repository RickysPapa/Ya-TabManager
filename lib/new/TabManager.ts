import RxDB from "~lib/rxdb";
import EventListener from "~lib/EventListener";
// import debounce from 'lodash/debounce';
// import { localGet, localSet } from "~/lib/utils";

const log = (...args) => {
  console.log.apply(null, ['[TabManager]'].concat(args));
}


export function simplify(tab: chrome.tabs.Tab): ITab{
  return {
    id: tab.id.toString(),
    wId: tab.windowId,
    title: tab.title,
    url: tab.url,
    icon: tab.favIconUrl,
    position: tab.index,
    cr: Date.now(),
    up: Date.now(),
    status: 0,
  };
}

class TabManager{
  __RxDB = null;
  __tabHistory = null;
  __isWorker = true;
  isInit = false;

  async init({ isWorker = true } = {}){
    this.__RxDB = await RxDB.getInstance();
    this.__tabHistory = this.__RxDB.tab_history;
    this.isInit = true;
    this.__tabHistory.update$.subscribe(changeEvent => console.dir(changeEvent));

    // 非 worker 页面需要主动监听 Tab 关闭实践，回调前台用到 closedTabs 的地方用以更新访问历史视图
    if(!isWorker){
      EventListener.listen<any>(chrome.tabs.onRemoved,() => {
        this.__tabHistory._queryCache._map.clear();
        this.getClosedTabs();
      });
    }
  }

  async bulkUpsert(docs){
    this.__RxDB.tab_history.bulkUpsert(docs)
  }

  async insert(item){
    if(item.id) {
      await this.__tabHistory.insert(item);
    }
  }

  async update(item: Partial<ITab>){
    if(item.id){
      item.id = typeof item.id === 'number' ? item.id.toString() : item.id;
      const doc = await this.__tabHistory.findOne(item.id).exec();
      if(!doc){
        console.error('doc not exist! >>>', doc);
      }
      await doc.incrementalPatch(item);
      // if(item.hasOwnProperty('status')){
      // }
    }else{
      throw Error('missing id');
    }
  }

  async close(){

  }

  async bulkClose(ids: number[]){
    if(Array.isArray(ids) && ids.length){
      log('bulkClose', ids);
      await this.__RxDB.tab_history.find({
        selector: {
          id: {
            $in: ids.map(_ => _.toString())
          }
        }
      }).update({
        $set: {
          status: 1
        }
      }).then(() => this.getClosedTabs());
    }
  }


  __closedWId = -1;
  __closedSubscriber = null;
  getClosedTabs(wId: number = 0, callback?: Function){
    if(!this.isInit){
      return ;
    }

    this.__closedWId = wId || this.__closedWId;
    if(callback){
      this.__closedSubscriber = (...args) => {
        const newFunc = (callback || function(){}).bind(this, ...args);
        setTimeout(newFunc, 300);
      }
    }

    const query = this.__tabHistory.find({
      selector: {
        wId: this.__closedWId,
        status: 1
      },
      sort: [
        {up: 'desc'}
      ]
    })

    // this.__tabHistory._queryCache._map.clear();

    if(this.__closedSubscriber){
      query.exec().then(this.__closedSubscriber);
      // if(wId){
      //   // 当传入 wId 时则是用户点击触发的回调，无需延时
      //   query.exec().then(this.__closedSubscriber);
      // }else{
      //   // 增加延迟主要是因为 worker 更新 idb 是异步的，过早获取数据会拿不到
      //   setTimeout(() => {
      //     query.exec().then(this.__closedSubscriber);
      //   }, 300)
      // }
    }
  }

  async moveClosedTabs(fromWId, toWId){
    const query = this.__tabHistory.find({
      selector: {
        wId: fromWId,
        status: 1
      },
    })
    await query.update({
      $set: {
        wId: toWId
      }
    })//.then(this.__closedSubscriber);
  }
}


const globalQueue = [];

const _tm = new TabManager();
const tm = new Proxy(_tm, {
  get(target, propKey){
    // console.log('proxy >>>', propKey, value);
    if(propKey === 'init'){
      return function(...args){
        console.log('proxy log >>>', target[propKey]);
        target[propKey].apply(target, args).then(() => {
          console.log('while >>>>', globalQueue.length);
          if(globalQueue.length){
            let item;
            while (item = globalQueue.shift()){
              console.log(item.func, target, item.args);
              item.func.apply(target, item.args)
            }
          }
        });
      }
    }else{
      if(!target.isInit){
        return function(...args){
          globalQueue.push({ func: target[propKey], args});
          // if(target[propKey].constructor.name === 'AsyncFunction'){
          // TODO 如果是异步可能要返回 Promise，否则外部 then 会报错
          // }
        }
      }
      return target[propKey];
    }
  },

});


export default tm;
