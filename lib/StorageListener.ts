// import debounce from "lodash/debounce";
// import { db } from "~lib/db";


class StorageListener {
  onListening = false;
  listener = {};
  constructor() {
    this.init();
  }

  init(){
    chrome.storage.onChanged.addListener((changes, areaName = 'local') => {
      if(this.listener[areaName]){
        Object.keys(changes).forEach(_k => {
          if(this.listener[areaName][_k]){
            // console.log(typeof this.listener[areaName][_k], this.listener[areaName][_k])
            this.listener[areaName][_k].forEach(fun => fun(changes[_k].newValue, changes[_k].oldValue));
            console.log(`storage.onChanged ${_k} callback  >> `, changes[_k].newValue);
          }
        })
      }
    });
    this.onListening = true;
  }

  listen<T>(key, cb: (newValue: T, oldValue: T) => void, area = 'local'){
    if(!this.listener[area]){
      this.listener[area] = {};
    }
    if(!this.listener[area][key]){
      this.listener[area][key] = [];
    }
    this.listener[area][key].push(cb);
    if(!this.onListening){
      this.init();
      this.onListening = true;
    }
  }
}

export default new StorageListener();
