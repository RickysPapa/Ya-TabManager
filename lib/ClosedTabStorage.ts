import debounce from 'lodash/debounce';
import type { ClosedTab } from "~lib/db";
import { localGet, localSet } from "~/lib/utils";

interface KV {
  [k: string]: ClosedTab[]
}

class ClosedTabStorage {
  storageKey: string = '$closed';
  // list: [] = [];
  kv: KV = {};
  // ts: number = Date.now();

  constructor({ storageKey = '' }) {
    this.storageKey = storageKey || this.storageKey;
    this.saveToCache = debounce(this.saveToCache.bind(this), 3000);
    localGet(storageKey).then((res) => {
      for(const [wId, list] of Object.entries(res as KV || {})){
        if(this.kv[wId]){
          this.kv[wId] = this.kv[wId].concat(list);
        }else{
          this.kv[wId] = list;
        }
      }
    });
  }

  getList(wId){
    return this.kv[wId];
  }

  unshift(item){
    if(!item.wId) return;
    if(!this.kv[item.wId]){
      this.kv[item.wId] = [];
    }
    this.kv[item.wId].unshift(item)
    this.saveToCache();
  }

  saveToCache(){
    console.log('closeTabStorage >>', this.kv);
    localSet({[this.storageKey]: this.kv});
  };

  // persist(){
  //   const list = Object.values(this.kv).reduce((acc, cur ) => {
  //     acc = acc.concat(cur.splice(20));
  //     return acc;
  //   }, [])
  //   if(list.length){
  //     db.closedTabs.bulkAdd(list);
  //     this.saveToCache();
  //   }
  // }
}

export default new ClosedTabStorage({ storageKey: '$closed' })
