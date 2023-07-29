import { useEffect, useState, useMemo } from "react";
import type { useSetState } from 'ahooks';
import { useBaseIdAndTimeStamp } from "~lib/utils";
import { localSet, localGet } from '~/lib/utils';
import dayjs from "dayjs";

export interface State<T> {
  sessionList: Session<T>[];
  isInit: boolean;
}

export interface UseSessionListProps<T> {
  useSetState: typeof useSetState;
  chromeStorageKey: string;
  initialData: Session<T>[]
}


export default function useSessionList<T extends YATab | ChromeTab>({ useSetState, chromeStorageKey = null, initialData = null}: UseSessionListProps<T>){
  const [ state, setState ] = useSetState<State<T>>({ sessionList: initialData || [], isInit: false });
  const { sessionList, isInit } = state;

  function reset(data: Session<T>[]){
    if(data){
      setState({ sessionList: data, isInit: true })
    }
  }

  function getSession(sid){
    return sessionList.find(_ => _.id === sid);
  }

  function createSession(params: {name: string, tabs: T[]}): void {
    const {name = '', tabs = [], ...other} = params;
    const {tsId, ts} = useBaseIdAndTimeStamp();
    setState({
      sessionList: [{
        id: tsId,
        name: name || `Untitled ${dayjs(ts).format('YYYY/MM/DD HH:mm')}`,
        tabs: tabs,
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
    updateSession(id, Object.assign({}, _session, {tabs}));
  }

  function addTabs(sid: $id, tabs: T[]){
    resetTabs(sid, tabs.concat(getTabs(sid) || []));
  }

  function updateTab(sid: $id, tab: $Tab){
    const tabs = getTabs(sid).map(_ => _.id === tab.id ? tab : _);
    resetTabs(sid, tabs);
  }

  function insertTab(sid: $id, tabIndex: number, tab: T){
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
      localGet(chromeStorageKey).then(res => {
        if(res){
          reset(res);
        }else{
          setState({
            isInit: true
          })
        }
      })
    }
  }, [])

  useEffect(() => {
    if(!isInit) return;
    console.log('save', sessionList);
    if(chromeStorageKey){
      localSet({[chromeStorageKey]: sessionList});
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
