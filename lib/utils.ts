export const NOOP = () => {};

/**
 * 生成时间戳和简化ID
 */
export const useBaseIdAndTimeStamp = () => {
  const ts = Date.now();
  const tsId = ts.toString(36);
  return { tsId, ts };
};

/**
 * 参数转换
 * @param key
 */
const str2Arr = (key: string | string[]): string[] => {
  let searchKeys: string[];
  if (!Array.isArray(key)) {
    searchKeys = [key];
  } else {
    searchKeys = key;
  }
  return searchKeys;
};

/**
 * chrome.local.get 方法封装
 * @param key
 */
export const localGet = async (key: string | string[]) => {
  if (!key) return;

  const searchKeys = str2Arr(key);
  if (searchKeys.length > 1) {
    return await chrome.storage.local.get(searchKeys);
  }
  const result = await chrome.storage.local.get(searchKeys);
  return result[searchKeys[0]];
};

/**
 * chrome.local.set 方法封装
 * @param data
 */
export const localSet = async (data: Record<string, any>) => {
  if (!data) return;
  return await chrome.storage.local.set(data);
};


export const lookLocalStorage = async () => {
  const res = await chrome.storage.local.get();
  console.table(res);
  const res1 = await chrome.storage.local.getBytesInUse();
  console.log(`lookLocalStorage >> ${res1}（${(res1 / 1e6).toFixed(2)}MB, ${(res1 / 1e6 / 5).toFixed(2)}%）`);
};

const getLocalStorageJSONData = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    console.error("getLocalStorageJSONData Error >>", e);
  }
};

export const localStorageGet = (key: string | string[]) => {
  if (!key) return;
  const searchKeys = str2Arr(key);
  if (searchKeys.length > 1) {
    return searchKeys.reduce((acc, cur) => {
      acc[cur] = getLocalStorageJSONData(cur);
      return acc;
    }, {});
  }
  return getLocalStorageJSONData(searchKeys[0]);
};

export const localStorageSet = (data) => {
  if (!data) return;
  Object.keys(data).forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(data[key]));
    } catch (e) {
      console.error("localSet Error >>", e);
    }
  });
};

interface chromeOnEvent {
  addEventListener: (fun: () => void) => void
}
export const addChromeListen = (eventList: chrome.events.Event<any> | chrome.events.Event<any>[], fun) => {
  let lisenters = [];
  if(Array.isArray(eventList)){
    lisenters = eventList;
  } else {
    lisenters = [eventList];
  }
  lisenters.forEach((item) => {
    item.addListener(fun);
  })
};

// export const findIndex = (arr, key, value) => {
//   arr.
// }
