import StorageListener from '../StorageListener';
import EventListener from '../EventListener';
import { useBaseIdAndTimeStamp } from "~lib/utils";
import { localSet, localGet, addChromeListen } from '~/lib/utils';
import { throttle, findIndex } from 'lodash';
import dayjs from 'dayjs';
import TMWindow from "~lib/TMWindow";
import Tab from "~lib/TMTab";

const NOOP = () => {};

interface IConstructor {
  onUpdate: (t: any) => any;
}

type TOnUpdate = (data: {current: chrome.windows.Window[], closed?: IWindow[] }) => void;

interface IInit {
  onUpdate?: TOnUpdate;
  // source?: string;
  isWorker?: boolean;
  // windowsInfo?: IWindowsInfo;
}

interface IWindowInfo {
  name?: string;
  createAt?: number;
  closed?: boolean;
}

export type IWindow = chrome.windows.Window & IWindowInfo;
export type IWindowsInfo = Record<number, IWindowInfo>;
const CACHE_WINDOWS = 'WINDOWS';
const CACHE_WINDOWS_EXT_INFO = 'WINDOWS_EXT_INFO';
const CACHE_WINDOWS_CLOSED = 'WINDOWS_CLOSED';
// let cache_windows = null;


class WindowManager {
  // 当前窗口列表(实时更新)
  _current: IWindow[] = [];
  // 已关闭(但用户未手动删除)的窗口列表
  _closed: IWindow[] = [];
  // 历史所有窗口信息（如果关闭的列表里，即可清除）
  _lasted: Record<number, chrome.windows.Window> = [];
  // 窗口的附加信息
  _extInfo: IWindowsInfo = {};
  // 是否初始化
  __isInit: boolean = false;
  // 是否 worker 进程
  _isWorker: boolean = false;

  // 数据更新后的通知回调，由外部传入
  onUpdate: TOnUpdate = NOOP;


  updateData = throttle(() => chrome.windows.getAll({populate: true}).then((windows) => {
    console.log('func >>>', this._isWorker ? '后台进程' : '前台页面', windows, Date.now());
    this._update(windows);
    if(this._isWorker){
      // 实时更新 windows 窗口缓存
      windows.forEach((item) => {
        this._lasted[item.id] = item;
      })
      localSet({[CACHE_WINDOWS]: this._lasted});
    }
  }), 1000)


  // TODO 用 Zustand 管理状态？同时支持 hooks 和非 hooks
  constructor() {
    // 初始化数据
    Promise.all([
      chrome.windows.getAll({populate: true}),
      localGet([CACHE_WINDOWS_EXT_INFO, CACHE_WINDOWS_CLOSED]),
    ]).then(([windows, cache]) => {
      this._extInfo = cache[CACHE_WINDOWS_EXT_INFO];
      this._closed = cache[CACHE_WINDOWS_CLOSED];
      this._update(windows);
    });
  }

  init({ onUpdate, isWorker }: IInit): void {
    if(this.__isInit){
      return;
    }
    this.__isInit = true;

    // 入参处理
    this.onUpdate = onUpdate || this.onUpdate;
    if(isWorker){
      this._isWorker = isWorker;
    }

    /**
     * =========== 业务初始化逻辑 ===========
     */

    // 业务配置了更新回调，初始化时马上调用响应业务
    if(this.onUpdate){
      this._update();
    }

    if(this._isWorker){
      // 初始化历史窗口数据
      localGet(CACHE_WINDOWS).then((res) => {
        // TODO 需要校验数据格式是否正确
        if(res){
          this._lasted = res;
        }
      });
    }

    // 用户自己关闭窗口，worker 会在后台更新缓存
    // 前台：通过管理器关闭窗口要同步到后端
    StorageListener.listen<IWindow[]>(CACHE_WINDOWS_CLOSED, (newValue) => {
      this._closed = newValue;
    });

    // 后台：新建窗口时会初始化数据 如创建时间
    // 前台：前台修改别名后更新缓存，用户直接关闭浏览器窗口需要保留别名信息
    StorageListener.listen<IWindowsInfo>(CACHE_WINDOWS_EXT_INFO, (newValue) => {
      this._extInfo = newValue;
    });

    /**
     * 新窗口出现时需要增加窗口的附加信息  _isWorker=true生效
     * @param win
     */
    const worker_onWindowCreated = (win) => {
      this._updateExtInfo(win.id, {
        createAt: Date.now(),
        // name: dayjs().format('YYYY/MM/DD HH:mm'),
        name: ''
      });
    };

    /**
     * 窗口关闭时要把窗口信息保存在关闭队列里
     * @param id
     */
    const worker_onWindowsRemoved = (id) => {
      console.log('worker_onWindowsRemoved >>', id);
      if(this._lasted[id] && this._lasted[id].tabs.length > 1){
        this._closed.unshift({
          ...(this._extInfo[id] || {}),
          ...this._lasted[id],
          closed: true
        });
      }
      localSet({[CACHE_WINDOWS_CLOSED]: this._closed});
    }

    EventListener.listen<any>([
      [chrome.windows.onCreated, this._isWorker ? worker_onWindowCreated : NOOP],
      [chrome.windows.onRemoved, this._isWorker ? worker_onWindowsRemoved : NOOP],
      chrome.tabs.onCreated,
      chrome.tabs.onRemoved,
      chrome.tabs.onUpdated,
    ], () => {
      this.updateData();
    });
  }

  /**
   * 用户手动更新窗口信息
   * @param wid
   * @param data
   */
  updateWindowInfo (wid: number, data: IWindowInfo) {
    this._updateExtInfo(wid, data);
  }

  removeWindow(wid: number){
    console.log('windowsManager removeWindow >>', wid);
    if(findIndex(this._current, ['id', wid]) >= 0){
      chrome.windows.remove(wid);
    }else{
      this._upsertClosed(wid);
    }
  }

  async _updateExtInfo(wid: number, data: IWindowInfo){
    const isClosedWindow = findIndex(this._closed, ['id', wid]) > -1;
    // const isRunningWindow = findIndex(this._current, ['id', wid]) > -1;
    // 如果是新创建的窗口，不会立即出现在缓存中，所以如果缓存中米有则说明是新建
    // const isExistWindow= this._lasted[wid];
    console.log('_updateExtInfo[0] >>', wid, isClosedWindow);
    if(isClosedWindow){
      await this._upsertClosed(wid, data);
    }else{
      this._extInfo[wid] = {...this._extInfo[wid], ...data};
      // const extInfo = await localGet(CACHE_WINDOWS_EXT_INFO);
      // const latestExtInfo = Object.assign({}, this._extInfo)
      // latestExtInfo[wid] = { ...latestExtInfo[wid], ...data }
      console.log('_updateExtInfo[0] >>', this._extInfo);
      this._update();
      await localSet({[CACHE_WINDOWS_EXT_INFO]: this._extInfo})
    }
  }

  async _upsertClosed(wid, data?: IWindowInfo | IWindow){
    // 因为前台和后台都会尽快更新历史（手动修改名称 | 关闭窗口自动触发）
    // 所以这里保持从缓存中获取最新值，这个方法调用频率不高
    // this._closed = await localGet(CACHE_WINDOWS_CLOSED);
    const index = findIndex(this._closed, ['id', wid]);
    if(index >= 0){
      if(data){
        this._closed[index] = { ...this._closed[index], ...data };
      }else{
        this._closed.splice(index, 1);
      }
    }else if(data){
      this._closed.unshift(data as IWindow);
    }
    this._update();
    await localSet({[CACHE_WINDOWS_CLOSED]: this._closed});
  }

  _update(windows = undefined){
    if(!windows){
      windows = this._current;
    }
    console.log('WindowManager _update >>');
    this._current = windows.map((_) => {
      return {
        ..._,
        ...(this._extInfo[_.id] || {})
      };
    })
    this.onUpdate && this.onUpdate({current: this._current.concat(this._closed)});
  }
}

const wm = new WindowManager();
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

export default wm;
