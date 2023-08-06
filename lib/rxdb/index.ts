import { createRxDatabase, addRxPlugin } from 'rxdb';
import type { RxDatabase, RxCollection } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import type { ICollection, ICollectionGroup, ICollectionItem } from '../new/CollectionManager';
import CollectionSchema from './CollectionSchema';
import CollectionGroupSchema from './CollectionGroupSchema';
import CollectionItemSchema from './CollectionItemSchema';

addRxPlugin(RxDBDevModePlugin);
export interface MyDatabaseCollections{
  collection_dirs: RxCollection<ICollection>,
  collection_groups: RxCollection<ICollectionGroup>,
  collection_items: RxCollection<ICollectionItem>,
}

export type IRxDB = RxDatabase<MyDatabaseCollections>;

// let rdb = null;

export default async () => {
  const db = await createRxDatabase<MyDatabaseCollections>({
    name: 'rdb',                   // <- name
    storage: getRxStorageDexie(),       // <- RxStorage
    multiInstance: false,                // <- multiInstance (optional, default: true)
    eventReduce: true,                  // <- eventReduce (optional, default: false)
    cleanupPolicy: {}                   // <- custom cleanup policy (optional)
  });

  await db.addCollections({
    collection_dirs: {
      schema: CollectionSchema
    },
    collection_groups: {
      schema: CollectionGroupSchema
    },
    collection_items: {
      schema: CollectionItemSchema
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

  return db;
};


// class RxDB {
//   __instance: null;
//   constructor() {
//   }
// }


// export default rdb;

