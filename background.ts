// import {db} from "~lib/db";
// import RxDB from "~lib/rxdb";
import debounce from 'lodash/debounce';
import ClosedTabStorage from "~lib/ClosedTabStorage";
import ClosedWindowStorage from "~lib/ClosedWindowStorage";
import TMWindow from "~lib/TMWindow";
import Tab, { simplify } from "~lib/TMTab";
import WindowManager from '~/lib/new/WindowManager'
import EventListener from '~/lib/EventListener';
import TabManager from "~lib/new/TabManager";

export {}


const log = (...args) => {
  console.log('$$BG >>', ...args);
}

// console.log(
//   "Live now; make now always the most precious time. Now will never come again.12995" + Date.now()
// )

// const RxDB = TabManager;

WindowManager.init({ isWorker: true });
(async function (){
  await TabManager.init();
  chrome.windows.getAll({populate: true}).then(_windowList => {
    _windowList.forEach((_w) => {
      // TODO 每次 worker 启动都会执行会太资源，使用时间戳减少更新量
      console.log('init getAll sasve>>>', _w.tabs.map(Tab.simplify));
      TabManager.bulkUpsert(_w.tabs.map(Tab.simplify));
    })
  })
})();

// TODO 第一次使用插件时需要初始化记录所有已打开的页面 or 重新启用插件要重新检查记录漏掉的页面


// chrome.runtime.onConnect.addListener(function(port) {
//   console.assert(port.name === "popup");
//   port.onMessage.addListener(function({ type, data }) {
//     if (type === 'reopenWindow'){
//       console.log('reopen Window');
//     }
//   });
// });


function openWindow(winId, options: { newWindow?: boolean, tabs?: any[] } = { newWindow: false }){
  let winInfo = null;
  if(winId){
    winInfo = WindowManager.getWindowInfo(winId);
  }else if(options?.tabs?.length){
    winInfo = { tabs: options.tabs };
  }else{
    return;
  }

  chrome.windows.create({
    url: winInfo.tabs.map(_ => _.url)
  }).then((_window) => {
    const _targetWindowId = _window.id;
    const _autoDiscard = (_tabId, changeInfo, tab) => {
      if(changeInfo.title && _targetWindowId && tab.windowId === _targetWindowId && tab.index !== 0){
        chrome.tabs.discard(_tabId);
      }
    }
    chrome.tabs.onUpdated.addListener(_autoDiscard);
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(_autoDiscard);
    }, 3000)

    log('openWindow', winInfo);
    if(winInfo.name){
      WindowManager.updateWindowInfo(_targetWindowId, {
        name: winInfo.name
      })
    }
    if(winId){
      WindowManager.removeWindow(winId);
      TabManager.moveClosedTabs(winId, _targetWindowId);
    }
  });
}

function openTabs(tabs, options = { newWindow: false }){
  const onlyOne = tabs.length === 1;
  if(options.newWindow){
    Promise.all(tabs.map(_ => chrome.tabs.create({ active: onlyOne, url: _.url })));
  }else{
    openWindow(null, { tabs })
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('sender', JSON.stringify(sender));
  // console.log('message', JSON.stringify(message));
  // sendResponse('hello');

  const { type, data } = message;
  if(type === 'OPEN_WINDOW'){
    if(!data?.wId) return;
    console.log('$bg onMessage >>', type, data);
    openWindow(data.wId);
  }else if(type === 'OPEN_TABS') {
    openTabs(data.tabs, { newWindow: data.newWindow });
  }else if(type === 'UPDATE_WINDOW_INFO') {
    if(!data?.wId) return;
    WindowManager.updateWindowInfo(data.wId, data.info);
  }
});


const createdMap = {};
async function _saveCreated(before){
  const bulkData = Object.values(createdMap)
    .filter(_ => _.updateAt <= before);
  await db.tabs.bulkPut(bulkData);
}

// async function _saveTabs(before){
//   const bulkData = Object.values(createdMap)
//   await db.tabs.bulkPut(bulkData);
// }


async function _deleteCurTabs(before){
  const bulkData = Object.values(createdMap)
    .filter(_ => _.updateAt <= before);
  await db.tabs.bulkPut(bulkData);
}

const saveCreated = debounce(_saveCreated, 3000);

const windowKV = {};
const windowList = [];

const globalQueue = [];
function callbackWrapper(func) {
  return (...args) => {
    if(TabManager.isInit){
      if(globalQueue.length){
        let item;
        while (item = globalQueue.shift()){
          item.func.apply(null, ...item.args)
        }
      }
      func.apply(null, args);
    }else{
      globalQueue.push({func, args});
    }
  }
}

chrome.windows.onCreated.addListener(callbackWrapper((window) => {
  console.log('windows.onCreated', window);
  const instance = new TMWindow({
    id: window.id,
    tabs: window.tabs,
    inBackground: true
  })
  windowList.push(instance);
  windowKV[window.id] = instance;
}))


chrome.windows.onRemoved.addListener(callbackWrapper((windowId) => {
  console.log('$bg windows.onRemoved', windowId);
}));

chrome.tabs.onDetached.addListener(() => {

});

chrome.tabs.onCreated.addListener(callbackWrapper((tab) => {
  console.log('$bg onCreated', tab);
  // windowKV[tab.windowId].add([Tab.simplify(tab)]);
  TabManager.insert(Tab.simplify(tab));
}));

chrome.tabs.onUpdated.addListener(callbackWrapper((tabId, changeInfo: chrome.tabs.TabChangeInfo, tab) => {
  console.log('$bg onUpdated >>', tabId, changeInfo, tab);
  if(changeInfo.status !== 'complete'){
    TabManager.update(Tab.simplify(tab));
  }
}));


// chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
//   console.log('onMoved', tabId, moveInfo);
// })

function getWindowInstance(wId){
  return windowKV[wId];
}

chrome.tabs.onRemoved.addListener(callbackWrapper(async (tabId, removeInfo) => {
  console.log('$bg onRemoved', tabId, removeInfo);
  if(!removeInfo.isWindowClosing){
    TabManager.update({
      id: tabId,
      status: 1
    });
  }
}));

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  console.log('$bg onAttached', tabId, attachInfo);
  TabManager.update({
    id: tabId,
    position: attachInfo.newPosition,
    wId: attachInfo.newWindowId
  });
})

chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
  TabManager.update({
    id: tabId,
    position: moveInfo.toIndex
  })
})


chrome.runtime.onSuspend.addListener(() => {
});

chrome.runtime.onSuspendCanceled.addListener(() => {
});

