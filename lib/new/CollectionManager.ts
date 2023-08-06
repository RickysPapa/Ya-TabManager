import StorageListener from '../StorageListener';
import EventListener from '../EventListener';
// import { useBaseIdAndTimeStamp } from "~lib/utils";
import { localSet, localGet, addChromeListen } from '~/lib/utils';
import { throttle, findIndex } from 'lodash';
import RxDB from '../rxdb';
import type { IRxDB } from '../rxdb';

import { nanoid } from 'nanoid';

// import dayjs from 'dayjs';
// import TMWindow from "~lib/TMWindow";
// import Tab from "~lib/TMTab";

const NOOP = () => {};

interface IConstructor {
  onUpdate: (t: any) => any;
}

type TOnUpdate = (data: { collections: ICollection[] }) => void;

interface IInit {
  onUpdate?: TOnUpdate;
  // source?: string;
  isWorker?: boolean;
  // windowsInfo?: IWindowsInfo;
}

const CACHE_COLLECTIONS= 'COLLECTIONS';

interface ICollectionCommon{
  id: string; // ts36
  type: 'rl' | 'bk'; // ReadLater / Bookmark
  visits?: number; // 访问次数
  lastVisit?: number; // 上一次访问时间（包括后台新增/删除）
  cr?: number;
}

export type ICollection = ICollectionCommon & {
  name: string;
};

export type ICollectionGroup = ICollectionCommon & {
  cid: string; // 集合id
  name: string;
  count?: number;  // 项目归属 ???
}

export type ICollectionItem = ICollectionCommon & {
  cid: string;
  cgid?: string;
  tags?: string; // 标签 xx,xx
  icon: string;
  title: string;
  url: string;
  status?: number; // 已读/未读
}

interface IReadNote{
  ciId: string; // 收藏id
  comment: string; // 评论
  highlight: string; // 高亮
}

// tab 存在 indexDB
// collections + 分组信息 列表存在 indexBB 但缓存在 storage 一份

class CollectionManager {
  __RxDB: IRxDB = null;
  _collections = [];
  _readLater: [];
  // 是否初始化
  __isInit: boolean = false;
  // 是否 worker 进程
  _isWorker: boolean = false;
  // 数据更新后的通知回调，由外部传入
  onUpdate: TOnUpdate;

  constructor() {
    // 初始化数据
  }

  async init({ onUpdate, isWorker }: IInit): Promise<void>{
    if(this.__isInit){
      return;
    }
    this.__isInit = true;

    // 入参处理
    this.onUpdate = onUpdate || this.onUpdate;
    if(isWorker){
      this._isWorker = isWorker;
    }

    this.__RxDB = await RxDB();

    // const readLaterCollection = await this.__RxDB.collection_dirs.findOne('readLater').exec();
    this.__RxDB.collection_dirs.findOne('readLater').exec().then(res => {
      if(!res){
        this.__RxDB.collection_dirs.insert({
          id: 'readLater',
          name: 'ReadLater',
          type: 'rl'
        })
      }
    })

    if(this.__RxDB){
      this.getDirs().then(dirs => {
        this._collections = dirs.map(dir => dir.toJSON());
        console.log('all dirs >>', this._collections);
        this._update();
      });
      this.__RxDB.collection_dirs.$.subscribe(changeEvent => console.dir(changeEvent));
    }

    /**
     * =========== 业务初始化逻辑 ===========
     */
    // 业务配置了更新回调，初始化时马上调用响应业务
    if(this.onUpdate){
      this._update();
    }

    if(!this._isWorker){
      // TODO 监听来自worker的消息，更新数据
    }
  }

  _update(){
    if(this.onUpdate){
      this.onUpdate({
        collections: this._collections
      })
    }
  }


  async createDir(name){
    return await this.__RxDB.collection_dirs.insert({
      id: nanoid(),
      name,
      type: 'bk'
    })
  }

  async createGroup(cid: string, name){
    return await this.__RxDB.collection_groups.insert({
      cid,
      id: nanoid(),
      name,
      type: 'bk'
    })
  }

  async readLater(data: Pick<ICollectionItem, 'title' | 'icon' | 'url'> | Pick<ICollectionItem, 'title' | 'icon' | 'url'>[]){
    await this.insertItem(data, {
      cid: 'readLater',
      type: 'rl',
    })
  }

  async insertItem(
    data: Pick<ICollectionItem, 'title' | 'icon' | 'url'> | Pick<ICollectionItem, 'title' | 'icon' | 'url'>[],
    options: { cName?: string; cgName?: string } & Partial<Pick<ICollectionItem, 'cid' | 'cgid' | 'tags' | 'type'>>
  ){
    let _cid = options.cid, _cgid = options.cgid;
    if(!_cid && options?.cName){
      const cDocument = await this.createDir(options.cName);
      _cid = cDocument.id;
    }
    if(!_cgid && options?.cgName){
      const cgDocument = await this.createGroup(_cid, options.cgName);
      _cgid = cgDocument.id;
    }

    if(!_cid){
      throw Error('_cid is Missing');
    }

    const dataInCommon = { cid: _cid, cgid: _cgid, type: options.type || 'bk' }
    if(Array.isArray(data)){
      await this.__RxDB.collection_items.bulkInsert(data.map(_ => ({
        id: nanoid(),
        ...dataInCommon,
        ..._,
      })))
    }else{
      await this.__RxDB.collection_items.insert({
        id: nanoid(),
        ...dataInCommon,
        ...data,
      })
    }
  }

  async getDirs(type: 'bk' | 'rl' = 'bk'){
    return await this.__RxDB.collection_dirs.find({
      selector: {
        type
      }
    }).exec();
  }

  async getGroups(cid){
    return await this.__RxDB.collection_groups.find({
      selector: {
        cid
      }
    }).exec();
  }

  async getItems({ cid, cgid }: { cid?: string; cgid?: string; }){
    return await this.__RxDB.collection_items.find({
      selector: {
        cid,
        cgid
      },
      sort: [{ up: 'desc' }]
    }).exec();
  }
}

const cm = new CollectionManager();
export default cm;
// const wm = new Proxy(new WindowManager({}), {
//   set(target, propKey, value){
//     console.log('proxy >>>', propKey, value);
//     if(propKey === '_data'){
//       target.onUpdate(value);
//     }else{
//       target[propKey] = value;
//     }
//     return true;
//   }
// });

// chrome.windows.getAll({populate: true}).then((windows) => {
//   // 如果立即执行 React 初始化还没执行完成，数据更新不进去
//   setTimeout(() => {
//     wm.update(windows);
//   }, 0)
// });

// export default wm;
