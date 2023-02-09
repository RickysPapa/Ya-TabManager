// import Dexie from 'dexie';
//
// export const db = new Dexie('tm');
// db.version(1).stores({
//   tabs: '++id, tabId', // Primary key and indexed props
// });


import Dexie, { Table } from 'dexie';

export interface Tab{
  id: number;
  wId: number;
  title: string;
  url: string;
  favIconUrl: string;
  createAt: number;
  updateAt: number;
}

export interface ClosedTab{
  id: number;
  wId: number;
  title: string;
  url: string;
  favIconUrl: string;
  createAt: number;
}

export class TMClassedDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  tabs!: Table<Tab>;
  closedTabs!: Table<ClosedTab>;

  constructor() {
    super('tm');
    this.version(4).stores({
      tabs: 'id, wId, updateAt, isClosed', // Primary key and indexed props
      closedTabs: '++id, wId'
    });
  }
}

export const db = new TMClassedDexie();
