import { createRxDatabase } from 'rxdb';
import type { RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import type { ICollection, ICollectionGroup, ICollectionItem } from '../new/CollectionManager';
import CollectionSchema from './CollectionSchema';
import CollectionGroupSchema from './CollectionGroupSchema';
import CollectionItemSchema from './CollectionItemSchema';

export interface MyDatabaseCollections{
  collectionDirs: RxCollection<ICollection>,
  collectionGroups: RxCollection<ICollectionGroup>,
  collectionItems: RxCollection<ICollectionItem>,
}

const rdb = await createRxDatabase<MyDatabaseCollections>({
  name: 'rdb',                   // <- name
  storage: getRxStorageDexie(),       // <- RxStorage
  multiInstance: false,                // <- multiInstance (optional, default: true)
  eventReduce: true,                  // <- eventReduce (optional, default: false)
  cleanupPolicy: {}                   // <- custom cleanup policy (optional)
});

await rdb.addCollections({
  collectionDirs: {
    schema: CollectionSchema
  },
  collectionGroups: {
    schema: CollectionGroupSchema
  },
  collectionItems: {
    schema: CollectionItemSchema
  }
})

export default rdb;

