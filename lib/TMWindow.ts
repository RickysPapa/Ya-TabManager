import StorageListener from './StorageListener';
import {simplify} from './TMTab';

function processInitialData(data){
  if(!data) return;
  if(Array.isArray(data)){
    const list = [];
    const kv = {};
    (data as ChromeWindow[]).forEach((_) => {
      list.push(_.id);
      kv[_.id] = _;
    })
    return {kv, list};
  }else{
    const ids =
      Object.values(data as SessionMap)
        .sort((a, b) => a.ts > b.ts ? 1 : -1)
        .map(_ => _.id)
    return {kv: data, list: ids};
  }
}
// type Mode = 'listen' | 'sync' | '';
// enum Mode {
//   none = '',
//   listen = 'listen'
// }

class TMWindow{
  id: number;
  name: string;
  activeTabId: number;
  relatedId?: number;
  tabList: YATab[];
  tabKV: {[_k: number]: any} = {};
  closedList: YATab[] = [];
  storageMode: string = ''; // listen 监听变化自动更新数据 | sync 主动更新后同步到存储中 | ''

  inBackground: boolean = false;

  // isListenMode:boolean = false;
  // isSyncMode: boolean = false;

  constructor({ id , tabs, inBackground }) {
    this.id = id.toString();
    this.inBackground = inBackground;
    // this.isListenMode = storageMode === 'listen';
    // this.isSyncMode = storageMode === 'sync';
    if(tabs){
      this.tabList = tabs.map(simplify);
      this.tabList.forEach((_) => {
        this.tabKV[_.id] =  _;
      })
    }
    chrome.storage.local.get([this.id]).then(res => {
      this.closedList = res[this.id]?.closedList || [];
    })
    this.syncStorage();

    if(!inBackground){
      StorageListener.listen(id, (res) => {
        this.reset(res);
      })
    }
  }

  syncStorage(){
    if(this.inBackground){
      console.log('syncStorage >>', this.id, this.tabList);
      // chrome.storage.local.get([this.id]).then((res) => {
      //   this.closedList = res[this.id];
      //   const localData = res[this.id] || {};
      //   chrome.storage.local.set({
      //     [this.id]: {
      //       cTabs: this.closedList,
      //       id: this.id,
      //       // name: this.name,
      //       tabs: this.tabList,
      //     }
      //   }).catch((e) => {
      //     throw e;
      //   });
      // })
    }
  }

  reset(tabs: YATab[]){
    this.tabList = tabs;
    (this.tabList).forEach((_) => {
      this.tabKV[_.id] = _;
    })
    this.syncStorage();
  }

  get(tabId){
    return this.tabKV[tabId];
  }

  add(items: YATab[], index){
    this.tabList.splice(index || this.tabList.length, 0, ...items);
    items.forEach((item) => {
      this.tabKV[item.id] = item;
    })
    this.syncStorage();
  }

  remove(ids: number[]){
    if(this.inBackground){
      this.closedList.push(this.get(ids[0]))
    }else{
      chrome.tabs.remove(ids);
    }
    this.tabList = this.tabList.filter(tab => !ids.includes(tab.id));
    this.syncStorage();
  }

  update(id, changeInfo){
    Object.assign(this.tabKV[id], changeInfo);
    this.syncStorage();
  }

  move(){
    // this.syncStorage();
  }
}


export default TMWindow;
