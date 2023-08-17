import RxDB from "~lib/rxdb";
import EventListener from "~lib/EventListener";
// import debounce from 'lodash/debounce';
// import { localGet, localSet } from "~/lib/utils";



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
      await doc.incrementalPatch(item);
      // if(item.hasOwnProperty('status')){
      // }
    }else{
      throw Error('missing id');
    }
  }

  __closedWId = -1;
  __closedSubscriber = null;
  getClosedTabs(wId: number = 0, callback?: Function){
    if(!this.isInit){
      return ;
    }

    this.__closedWId = wId || this.__closedWId;
    this.__closedSubscriber = callback || this.__closedSubscriber;

    const query = this.__tabHistory.find({
      selector: {
        wId: this.__closedWId,
        status: 1
      },
      sort: [
        {up: 'desc'}
      ]
    })

    this.__tabHistory._queryCache._map.clear();

    if(this.__closedSubscriber){
      if(wId){
        // 当传入 wId 时则是用户点击触发的回调，无需延时
        query.exec().then(this.__closedSubscriber);
      }else{
        // 增加延迟主要是因为 worker 更新 idb 是异步的，过早获取数据会拿不到
        setTimeout(() => {
          query.exec().then(this.__closedSubscriber);
        }, 300)
      }
    }
  }
}

export default new TabManager()
