import StorageListener from '../StorageListener';
import EventListener from '../EventListener';
import { useBaseIdAndTimeStamp } from "~lib/utils";
import { localSet, localGet, addChromeListen } from '~/lib/utils';
import { throttle } from 'lodash';
import dayjs from 'dayjs';
import TMWindow from "~lib/TMWindow";
import Tab from "~lib/TMTab";

const NOOP = () => {};

interface IConstructor {
  onUpdate: (t: any) => any;
}

type TOnUpdate = (windows?: chrome.windows.Window[]) => void;

interface IInit {
  onUpdate?: TOnUpdate;
  source?: string;
  storageMode?: 'read' | 'write';
  windowsInfo?: IWindowsInfo;
}

interface IWindowInfo {
  name?: string;
  createAt?: number
}

export type IWindow = chrome.windows.Window & IWindowInfo;
export type IWindowsInfo = Record<number, IWindowInfo>;
const CACHE_WINDOWS_INFO = 'WINDOWS_INFO';


class WindowManager {
  _data: IWindow[] = [];
  storageMode: string = '';
  windowsInfo: IWindowsInfo = {};
  source: string = 'default';
  onUpdate: TOnUpdate = NOOP;

  updateData = throttle(() => chrome.windows.getAll({populate: true}).then((windows) => {
    console.log('func >>>', this.source, windows, Date.now());
    this.update(windows);
  }), 1000)


  // TODO 用 Zustand 管理状态？同时支持 hooks 和非 hooks
  constructor() {
    StorageListener.listen<IWindowsInfo>('windowsInfo', (newValue) => {
      this.windowsInfo = newValue;
    })

    const onWindowCreatedCallback = (win) => {
      this.updateData();
      this.windowsInfo[win.id] = {
        createAt: Date.now(),
        name: dayjs().format('YYYY/MM/DD HH:mm'),
      }
      if(this.storageMode === 'write'){
        chrome.storage.local.set({
          [CACHE_WINDOWS_INFO]: this.windowsInfo
        })
      }
    };

    EventListener.listen([
      [chrome.windows.onCreated, onWindowCreatedCallback],
      chrome.windows.onRemoved,
      chrome.tabs.onCreated,
      chrome.tabs.onRemoved,
      chrome.tabs.onUpdated,
    ], () => {
      this.updateData();
    });
  }

  init({ onUpdate, source, storageMode, windowsInfo }: IInit): void {
    this.onUpdate = onUpdate || this.onUpdate;
    this.source = source || this.source;
    if(storageMode){
      this.storageMode = storageMode;
      if(storageMode === 'read'){
        StorageListener.listen<IWindowsInfo>(CACHE_WINDOWS_INFO, (newValue) => {
          this.windowsInfo = newValue;
          this.update();
        });
      }
    }
    if(windowsInfo){
      this.windowsInfo = windowsInfo;
      this.update();
    }
  }

  get(){
    return this._data;
  }

  update(windows = undefined){
    if(!windows){
      windows = this._data;
    }
    const _windows = windows.map((_) => {
      return {
        ..._,
        ...(this.windowsInfo[_.id] || {})
      };
    })
    this._data = _windows;
    this.onUpdate && this.onUpdate(_windows);
  }
}

const wm = new WindowManager();
localGet(CACHE_WINDOWS_INFO).then(data => wm.init({ windowsInfo: data }));
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

chrome.windows.getAll({populate: true}).then((windows) => {
  // 如果立即执行 React 初始化还没执行完成，数据更新不进去
  setTimeout(() => {
    wm.update(windows);
  }, 0)
});

export default wm;
