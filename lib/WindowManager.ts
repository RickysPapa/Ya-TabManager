import StorageListener from './StorageListener';
import { useBaseIdAndTimeStamp } from "~lib/utils";
import dayjs from "dayjs";

function processInitialData(data){
  if(!data) return;
  if(Array.isArray(data)){
    const list = [];
    const kv = {};
    (data as ChromeWindow[]).forEach((_) => {
      list.push(_.id);
      kv[_.id] = _;
    })
    return {kv, list};
  }else{
    const ids =
      Object.values(data as SessionMap)
        .sort((a, b) => a.ts > b.ts ? 1 : -1)
        .map(_ => _.id)
    return {kv: data, list: ids};
  }
}
// type Mode = 'listen' | 'sync' | '';
// enum Mode {
//   none = '',
//   listen = 'listen'
// }

class WindowManager{
  kv: {[_k: number]: any} = {};
  list: number[] = [];
  _primaryKey: string = 'id';
  _storageKey: string = '';
  // TODO 这个 TS 怎么写？
  _storageMode: string = ''; // listen 监听变化自动更新数据 | sync 主动更新后同步到存储中 | ''

  constructor({ primaryKey = 'id', storageKey = '', storageMode = '' } = {}) {
    this._primaryKey = primaryKey;
    this._storageKey = storageKey;
    this._storageMode = storageMode;
    if(storageMode === 'listen'){
      StorageListener.listen(storageKey, (res) => {
        this.reset(res);
      })
    }
  }

  syncStorage(){
    if(this._storageKey && this._storageMode === 'sync'){
      chrome.storage.local.set({[this._storageKey]: this.list}).catch((e) => {
        throw e;
      });
    }
  }

  reset(_list){
    this.list = _list;
    this.list.forEach((_) => {
      this.kv[_[this._primaryKey]] = _;
    })
    this.syncStorage();
  }


  reset(data: ChromeWindow[] | SessionMap){
    const _state =  processInitialData(data);
    if(_state){
      setState({ ..._state, isInit: true})
    }
  },
  updateTabs(id: $id, tabs: $Tabs){
    _updateTabs(id, tabs);
  },
  /**
   * Add tabs to Session item
   * @param id
   * @param tabs
   */
  addTabs(id: $id, tabs: SessionTab[]){
    _updateTabs(id, tabs.concat((kv[id]?.tabs as SessionTab[]) || []));
  },
  /**
   * Remove tabs from Session item
   * @param id
   * @param tabIds
   */
  removeTabs(id: $id, tabIds: $id[]){
    const _tabs = (kv?.[id].tabs as SessionTab[]).filter(_ => !tabIds.includes(_.id));
    if(_tabs.length){
      _updateTabs(id, _tabs);
    }else{
      this.removeList(id);
    }
  },
  removeList(id: string | string[]){
    const ids = Array.isArray(id) ? id : [id];
    setState({
      list: list.filter(_ => !ids.includes(_)),
      kv: Object.values(kv).reduce((acc, cur) => {
        if(cur.id !== id){
          acc[cur.id] = cur;
        }
        return acc;
      }, {})
    })
  },
  create({name, tabs}: {name?: string, tabs: SessionTab[]}){
    const {tsId, ts} = useBaseIdAndTimeStamp();
    setState({
      kv: Object.assign({}, kv, {
        [tsId]: {
          id: tsId,
          name: name || `Untitled ${dayjs(ts).format('YYYY/MM/DD HH:mm')}`,
          tabs,
          ts
        }
      }),
      list: [...list, tsId]
    })
  }
}


export default WindowManager;
