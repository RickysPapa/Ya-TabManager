import { useEffect, useState, useMemo, useRef } from "react";
// import { useBaseIdAndTimeStamp } from "~tabs/utils";
import { useBaseIdAndTimeStamp } from "~lib/utils";
import dayjs from "dayjs";

interface SessionTab {
  id: string;
  icon: string;
  title: string;
  url: string;
  ts: number;
}

interface Session {
  id: string;
  ts: number;
  name: string;
  tabs: SessionTab[];
}

interface Window extends chrome.windows.Window{
  name?: string;
}


interface SessionMap {
  [key: string | number]: Session
}

interface WindowMap {
  [key: string | number]: Window
}



type $id = number | string;
type $Session = Session | Window;
type $Tab = SessionTab | chrome.tabs.Tab;
// declare type $SessionTab = SessionTab | chrome.tabs.Tab;



export function useSessionList({chromeStorageKey = null} = {}){
  const [list, setList] = useState<string[]>([]);
  const [kv, setKv] = useState({});
  const [isInit, setInit] = useState(false):
  // const isInit = useRef(false);

  useEffect(() => {
    if(!isInit) return;
    if(chromeStorageKey){
      chrome.storage.local.set({[chromeStorageKey]: kv}).catch((e) => {
        throw e;
      });
    }
  }, [kv])

  function _updateTabs(id, tabs){
    setKv({
      ...kv,
      [id]: {
        ...kv[id],
        tabs
      }
    });
  }

  const API = useMemo(() => {
    return {
      reset(data: $Session[] | {[key: $id]: Session}){
        if(!data) return;
        if(Array.isArray(data)){
          const _list = [];
          const _map = {};
          data.forEach((_) => {
            _list.push(_.id);
            _map[_.id] = _;
          })
          setKv(_map);
          setList(_list);
        }else{
          setKv(data);
          const ids =
            Object.values(data)
            .sort((a, b) => a.ts > b.ts ? 1 : -1)
            .map(_ => _.id)
          setList(ids);
          debugger
        }
        setInit(true);
      },
      updateTabs(id: $id, tabs: $Tab[]){
        _updateTabs(id, tabs);
      },
      addTabs(id: $id, tabs: $Tab[]){
        _updateTabs(id, tabs.concat(kv[id]?.tabs || []));
      },
      remove(id: string | string[]){
        const ids = Array.isArray(id) ? id : [id];
        setList(list.filter(_ => !ids.includes(_)));
        // TODO Should update the map?
      },
      create({name, tabs}: {name?: string, tabs: $Tab}){
        const {tsId, ts} = useBaseIdAndTimeStamp();
        setList([...list, tsId]);
        setKv({
          ...kv,
          [tsId]: {
            id: tsId,
            name: name || `Untitled ${dayjs(ts).format('YYYY/MM/DD HH:mm')}`,
            tabs,
            ts
          }
        })
      }
    }
  }, [kv, list]);


  return {
    list, kv,
    ...API
    // reset, updateTabs, addTabs, remove, create
  };
}
