// import Dexie from 'dexie';
//
// export const db = new Dexie('tm');
// db.version(1).stores({
//   tabs: '++id, tabId', // Primary key and indexed props
// });


import Dexie, { type Table } from 'dexie';
import type { ICollection, ICollectionGroup, ICollectionItem } from './new/CollectionManager';

export interface Tab{
  id: number;
  wId: number;
  title: string;
  url: string;
  favIconUrl: string;
  createAt: number;
  updateAt: number;
}

// export interface ClosedTab{
//   id: number;
//   wId: number;
//   title: string;
//   url: string;
//   favIconUrl: string;
//   createAt: number;
// }

export class TMClassedDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  tabs!: Table<Tab>;
  // collections!: Table<ICollection>;
  // collectionGroups!: Table<ICollectionGroup>;
  // collectionItems!: Table<ICollectionItem>;

  constructor() {
    super('tm');
    this.version(4).stores({
      tabs: 'id, wId, isClosed', // Primary key and indexed props
      // collections: 'id', // Primary key and indexed props
      // collectionGroups: 'id', // Primary key and indexed props
      // collectionItems: 'id, cId, cgId, type, status', // Primary key and indexed props
    });
  }
}

export const db = new TMClassedDexie();
