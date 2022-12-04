import { useEffect, useState, useMemo, useRef } from "react";
import { useBaseIdAndTimeStamp } from "~lib/utils";
import dayjs from "dayjs";

export function useSessionList({chromeStorageKey = null, initialData = null} = {}){
  const [list, setList] = useState<string[]>([]);
  const [kv, setKv] = useState<WindowMap | SessionMap>({});
  const [isInit, setInit] = useState(false);

  const API = useMemo(() => {
    return {
      reset(data: ChromeWindow[] | SessionMap){
        if(!data) return;
        if(Array.isArray(data)){
          const _list = [];
          const _map = {};
          (data as ChromeWindow[]).forEach((_) => {
            _list.push(_.id);
            _map[_.id] = _;
          })
          setKv(_map);
          setList(_list);
        }else{
          setKv(data as SessionMap);
          const ids =
            Object.values(data as SessionMap)
              .sort((a, b) => a.ts > b.ts ? 1 : -1)
              .map(_ => _.id)
          setList(ids);
        }
        setInit(true);
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
          this.remove(id);
        }
      },
      remove(id: string | string[]){
        const ids = Array.isArray(id) ? id : [id];
        setList(list.filter(_ => !ids.includes(_)));
        setKv(Object.values(kv).reduce((acc, cur) => {
          acc[cur.id] = cur;
          return acc;
        }, {}));
      },
      create({name, tabs}: {name?: string, tabs: SessionTab[]}){
        const {tsId, ts} = useBaseIdAndTimeStamp();
        setList([...list, tsId]);
        setKv(Object.assign({}, kv, {
          [tsId]: {
            id: tsId,
            name: name || `Untitled ${dayjs(ts).format('YYYY/MM/DD HH:mm')}`,
            tabs,
            ts
          }
        }));
      }
    }
  }, [kv, list]);

  useEffect(() => {
    if(initialData){
      API.reset(initialData);
    }
  }, [])

  useEffect(() => {
    if(!isInit) return;
    if(chromeStorageKey){
      chrome.storage.local.set({[chromeStorageKey]: kv}).catch((e) => {
        throw e;
      });
    }
  }, [kv])

  function _updateTabs(id, tabs){
    setKv(Object.assign({}, kv, {
      [id]: {
        ...kv[id],
        tabs
      }
    }));
  }

  return {
    list, kv,
    ...API
    // reset, updateTabs, addTabs, remove, create
  };
}
