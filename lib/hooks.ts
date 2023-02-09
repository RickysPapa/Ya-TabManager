import { useEffect, useState, useMemo } from "react";
import {useSetState} from 'ahooks';
import { useBaseIdAndTimeStamp } from "~lib/utils";
import dayjs from "dayjs";

function processInitialData(data){
  if(!data) return;
  return data;
  // if(Array.isArray(data)){
    // const list = [];
    // const kv = {};
    // (data as ChromeWindow[]).forEach((_) => {
    //   list.push(_.id);
    //   kv[_.id] = _;
    // })
    // return {kv, list};
  // }else{
    // const ids =
    //   Object.values(data as SessionMap)
    //     .sort((a, b) => a.ts > b.ts ? 1 : -1)
    //     .map(_ => _.id)
    // return {kv: data, list: ids};
  // }
}

interface State {
  sessionList: Session[];
  // kv: WindowMap | SessionMap;
  isInit: boolean;
}

// TODO 去除 KV 结构，太复杂，先实现功能再考虑性能
export function useSessionList({chromeStorageKey = null, initialData = null} = {}){
  const [ state, setState ] = useSetState<State>({ sessionList: initialData || [], isInit: false });
  const { sessionList, isInit } = state;

  function reset(data: Session[]){
    if(data){
      setState({ sessionList: data, isInit: true })
    }
  }

  function getSession(sid){
    return sessionList.find(_ => _.id === sid);
  }

  function createSession({name = '', tabs = [], ...other} = {}){
    const {tsId, ts} = useBaseIdAndTimeStamp();
    setState({
      sessionList: [{
        id: tsId,
        name: name || `Untitled ${dayjs(ts).format('YYYY/MM/DD HH:mm')}`,
        tabs,
        ts,
        ...other,
      }, ...sessionList]
    })
  }

  function updateSession(sid, session){
    setState({
      sessionList: sessionList.map(_ => _.id === sid ? session : _)
    })
  }

  function removeSession(sid){
    setState({sessionList: sessionList.filter(_ => _.id !== sid)}) ;
  }

  function getTabs(sid){
    return sessionList.find(_ => _.id === sid)?.tabs || [];
  }

  function resetTabs(id, tabs){
    const _session = getSession(id);
    _session.tabs = tabs;
    updateSession(id, Object.assign({}, _session, {tabs}));
  }

  function addTabs(sid: $id, tabs: SessionTab[]){
    resetTabs(sid, tabs.concat(getTabs(sid) || []));
  }

  function updateTab(sid: $id, tab: $Tab){
    const tabs = getTabs(sid).map(_ => _.id === tab.id ? tab : _);
    resetTabs(sid, tabs);
  }

  function insertTab(sid: $id, tabIndex: number, tab: SessionTab){
    const _tabs = getTabs(sid);
    if(_tabs){
      resetTabs(sid, [..._tabs].splice(tabIndex, 0, tab));
    }else{
      resetTabs(sid, [tab]);
    }
  }

  function removeTabs(sid: $id, tabIds: $id[]){
    const _tabs = getTabs(sid).filter(_ => !tabIds.includes(_.id));
    if(_tabs.length){
      resetTabs(sid, _tabs);
    }else{
      removeSession(sid);
    }
  }

  function removeTab(sid: $id, tabId: number){
    removeTabs(sid, [tabId])
  }


  useEffect(() => {
    if(chromeStorageKey){
      chrome.storage.local.get([chromeStorageKey]).then((res) => {
        if(res[chromeStorageKey]){
          reset(res[chromeStorageKey]);
        }else{
          setState({
            isInit: true
          })
        }
      });
    }
  }, [])

  useEffect(() => {
    if(!isInit) return;
    console.log('save', sessionList);
    if(chromeStorageKey){
      chrome.storage.local.set({[chromeStorageKey]: sessionList}).catch((e) => {
        throw e;
      });
    }
  }, [sessionList])

  return {
    list: sessionList,
    // session 操作
    reset,
    createSession,
    getSession,
    updateSession,
    removeSession,
    // Tab 操作
    resetTabs,
    getTabs,
    addTabs,
    insertTab,
    updateTab,
    removeTab,
    removeTabs
  };
}
