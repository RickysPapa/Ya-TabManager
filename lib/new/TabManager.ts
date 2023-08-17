import RxDB from "~lib/rxdb";
// import debounce from 'lodash/debounce';
// import { localGet, localSet } from "~/lib/utils";


class TabManager{
  __RxDB = null;
  __tabHistory = null;
  isInit = false;
  // constructor() {
  //   // this.saveToCache = debounce(this.saveToCache.bind(this), 3000);
  // }

  async init(){
    this.__RxDB = await RxDB.getInstance();
    this.__tabHistory = this.__RxDB.tab_history;
    this.isInit = true;
    // return this.__RxDB;
  }

  async bulkUpsert(docs){
    this.__RxDB.tab_history.bulkUpsert(docs)
  }

  async insert(item){
    if(item.id) {
      await this.__tabHistory.insert(item);
    }
  }


  async update(item){
    if(item.id){
      item.id = typeof item.id === 'number' ? item.id.toString() : item.id;
      console.log('udpate >>', item);
      const doc = await this.__tabHistory.findOne(item.id).exec();
      await doc.incrementalPatch(item);
    }
    // this.__RxDB.tab_history.upsert(item)
  }
}

export default new TabManager()
