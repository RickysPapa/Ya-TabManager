// import { useSessionList } from './lib/hooks';
// import {useRequest} from 'ahooks';
import {db, ClosedTab} from "~lib/db";
import debounce from 'lodash/debounce';
import ClosedTabStorage from "~lib/ClosedTabStorage";
import ClosedWindowStorage from "~lib/ClosedWindowStorage";
import TMWindow from "~lib/TMWindow";
import Tab, { simplify } from "~lib/TMTab";
import WindowManager from '~/lib/new/WindowManager'

WindowManager.init({ source: 'background', storageMode: 'write' });

export {}

console.log(
  "Live now; make now always the most precious time. Now will never come again.12995" + Date.now()
)


// TODO 第一次使用插件时需要初始化记录所有已打开的页面 or 重新启用插件要重新检查记录漏掉的页面


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

chrome.windows.getAll({populate: true}).then(_windowList => {
  _windowList.forEach((_w) => {
    const instance = new TMWindow({
      id: _w.id,
      tabs: _w.tabs,
      inBackground: true
    })
    windowList.push(instance);
    windowKV[_w.id] = instance;

    // TODO 每次 worker 启动都会执行会太资源，使用时间戳减少更新量
    db.tabs.bulkPut(_w.tabs.map(Tab.simplify));
  })
})

chrome.windows.onCreated.addListener((window) => {
  console.log('windows.onCreated', window);
  const instance = new TMWindow({
    id: window.id,
    tabs: window.tabs,
    inBackground: true
  })
  windowList.push(instance);
  windowKV[window.id] = instance;
})

chrome.windows.onRemoved.addListener((windowId) => {
  console.log('$bg windows.onRemoved', windowId);

})

chrome.tabs.onCreated.addListener((tab) => {
  console.log('$bg onCreated', tab);
  windowKV[tab.windowId].add([Tab.simplify(tab)]);
});

// chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
//   console.log('onMoved', tabId, moveInfo);
// })

function getWindowInstance(wId){
  return windowKV[wId];
}

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const tabInfo = await db.tabs.get(tabId);
  console.log('$bg onRemoved >>', removeInfo, tabInfo);
  if(removeInfo.isWindowClosing){
    ClosedWindowStorage.unshift(tabInfo);
  }else if(tabInfo){
    tabInfo.isClosed = 1;
    ClosedTabStorage.unshift(tabInfo);
    await db.tabs.put(tabInfo, tabId);
  }
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  console.log('$bg onAttached', tabId, attachInfo);
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('$bg onUpdated >>', tabId, changeInfo, tab);
  if(changeInfo.status !== 'complete'){
    db.tabs.put(simplify(tab), tabId) ;
  }

  // const _ins = getWindowInstance(tab.windowId);
  // _ins.update(tabId, changeInfo);

  // const now = Date.now();
  // const tabInfo = {
  //   id: tab.id,
  //   wId: tab.windowId,
  //   title: tab.title,
  //   url: tab.url,
  //   favIconUrl:tab.favIconUrl,
  //   isClosed: 0,
  // };
  // createdMap[tabId] = Object.assign((createdMap[tabId] || { createAt: now }), tabInfo, {updateAt: now});
  //
  // saveCreated(now);
})

chrome.runtime.onSuspend.addListener(() => {
});

chrome.runtime.onSuspendCanceled.addListener(() => {
});

