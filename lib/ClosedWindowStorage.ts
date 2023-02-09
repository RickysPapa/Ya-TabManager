import debounce from 'lodash/debounce';
import type { ClosedTab } from "~lib/db";

interface KV {
  [k: string]: ClosedTab[]
}

const STORAGE_KEY = '$closedWindows';
class ClosedWindowStorage {
  kv: KV = {};

  constructor() {
    this.saveToCache = debounce(this.saveToCache.bind(this), 500);
    chrome.storage.local.get(STORAGE_KEY).then((res) => {
      this.kv = res[STORAGE_KEY] || {};
    })
  }

  getList(wId){
    return this.kv[wId];
  }

  unshift(item){
    if(!item.wId) return;
    if(!this.kv[item.wId]){
      this.kv[item.wId] = {
        tabs: []
      };
    }
    this.kv[item.wId].tabs.unshift(item)
    // this.ts = Date.now();
    // console.log('ts Update > ', this.ts)
    this.saveToCache();
  }

  saveToCache(){
    console.log('ClosedWindowStorage >>', this.kv);
    chrome.storage.local.set({[STORAGE_KEY]: this.kv}).catch((e) => {
      throw e;
    });
  };
}

export default new ClosedWindowStorage()
