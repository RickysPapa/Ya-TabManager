// import debounce from "lodash/debounce";
// import { db } from "~lib/db";


class StorageListener {
  onListening = false;
  listener = {};
  // constructor() {
  // }

  listen(key, cb){
    this.listener[key] = cb;
    if(!this.onListening){
      this.onListening = true;
      chrome.storage.onChanged.addListener((changes) => {
        Object.keys(changes).forEach(_k => {
          if(this.listener[_k]){
            this.listener[_k](changes[_k].newValue, changes[_k].oldValue);
            console.log(`storage.onChanged ${_k} callback  >> `, changes[_k].newValue);
          }
        })
      });
    }
  }
}

export default new StorageListener();
