import { createRxDatabase, addRxPlugin, isRxDocument } from 'rxdb';
import type { RxDatabase, RxCollection } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import type { ICollection, ICollectionGroup, ICollectionItem } from '../new/CollectionManager';
import CollectionSchema from './CollectionSchema';
import CollectionGroupSchema from './CollectionGroupSchema';
import CollectionItemSchema from './CollectionItemSchema';
import TabHistorySchema from './TabHistorySchema';

// addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBMigrationPlugin);

export interface MyDatabaseCollections{
  collection_dirs: RxCollection<ICollection>,
  collection_groups: RxCollection<ICollectionGroup>,
  collection_items: RxCollection<ICollectionItem>,
  tab_history: RxCollection<ITab>,
}

export type IRxDB = RxDatabase<MyDatabaseCollections>;

const migrationStrategies = {
  1: function(oldDoc){
    return oldDoc;
  }
}

class RxDB {
  __instance = this.__init();
  _init = false;
  constructor() {
    console.log('constructor>>>>.....');
    // this.__instance = this.init();
  }

  async getInstance(): Promise<IRxDB>{
    return await this.__instance;
  }

  async __init(){
    console.log('init>>>>.....');

    const db = await createRxDatabase<MyDatabaseCollections>({
      name: 'rdb',                   // <- name
      storage: getRxStorageDexie(),       // <- RxStorage
      multiInstance: false,                // <- multiInstance (optional, default: true)
      eventReduce: true,                  // <- eventReduce (optional, default: false)
      cleanupPolicy: {}                   // <- custom cleanup policy (optional)
    });

    await db.addCollections({
      collection_dirs: {
        schema: CollectionSchema,
        migrationStrategies
      },
      collection_groups: {
        schema: CollectionGroupSchema,
        migrationStrategies
      },
      collection_items: {
        schema: CollectionItemSchema,
        migrationStrategies
      },
      tab_history: {
        schema: TabHistorySchema,
        migrationStrategies: Object.assign({}, migrationStrategies, {
          2: function(oldDoc){
            return oldDoc;
          }
        })
      }
    })

    db.collection_dirs.preInsert(function(plainData){
      const ts = Date.now()
      plainData.lastVisit = ts;
      plainData.cr = ts;
    }, false);

    db.collection_groups.preInsert(function(plainData){
      const ts = Date.now()
      plainData.lastVisit = ts;
      plainData.cr = ts;
    }, false);

    db.collection_items.preInsert(function(plainData){
      const ts = Date.now()
      plainData.lastVisit = ts;
      plainData.cr = ts;
    }, false);

    db.tab_history.preInsert(function(plainData){
      console.log('tab_history preInsert1 >>');
      const ts = Date.now()
      plainData.up = ts;
      plainData.cr = ts;
      // plainData.cr = 1691682282585;
      console.log('tab_history preInsert plainData >>', plainData);
    }, false);

    db.tab_history.preSave(function(plainData, rxDocument){
      // console.log('tab_history preSave2 >>');
      // console.log('tab_history preSave cr2 >>', rxDocument, plainData);
      const compareKey = ['icon', 'title', 'url', 'wId', 'position'];
      // 有更新使用最新的 up 值
      if(JSON.stringify(plainData, compareKey) !== JSON.stringify(rxDocument, compareKey)){
        plainData.cr = rxDocument.cr;
      }else{
        // 无更新使用旧值
        plainData.cr = rxDocument.cr;
        plainData.up = rxDocument.up;
      }
      // console.log('tab_history preSave plainData >>', plainData);
      // plainData.cr
      // modify anyField before saving
      // plainData.anyField = 'anyValue';
    }, false);

    this.__instance = db;
    return this.__instance;
  }
}
// let rdb = null;
export default new RxDB();


// class RxDB {
//   __instance: null;
//   constructor() {
//   }
// }


// export default rdb;

