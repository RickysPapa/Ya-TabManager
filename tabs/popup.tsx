import { useEffect, useState, useMemo, useRef } from "react";
import {useSetState, useToggle, useMap, useSelections} from 'ahooks';
import {Modal, Form, Input } from 'antd';
import {useBaseIdAndTimeStamp} from '~lib/utils';
import dayjs from 'dayjs';
import './popup.less';
import { useSessionList } from "~lib/hooks";

const SESSION_TYPE_LIST = {
  session: 'savedSessionList',
  window: 'windowList',
  readLater: 'readLaterList'
}

const STORAGE_KEY = {
  session: '$session',
  readLater: '$readLater'
}

const IndexPopup = () => {
  const [state, setState] = useSetState<ManagerState>({
    // Total Data
    windowList: [],
    savedSessionList: [],
    readLaterList: [],
    // For current data
    curSessionType: 'window',
    curSessionId: 0,
    shouldGroupByDomain: false,
    // curSessionTabs: [],
    // curShownTabs: [],
    // For User-Action
    // tabSelected: [],
    // domainList: null,
    curDomain: '',
  });

  console.log('>>>>');
  const {curSessionType, curSessionId} = state;

  const [form] = Form.useForm();
  const [modalShow, {toggle: toggleModelShow}] = useToggle(false);
  const [removedMap, removedMapApi] = useMap([]);
  const [openedUrlMap, openedTabMapApi] = useMap([]);

  const $windows = useSessionList();
  const $sessions = useSessionList({chromeStorageKey: '$session'});
  const $readLater = useSessionList({chromeStorageKey: '$readLater'});

  console.log('$sessions >>', $sessions);
  console.log('$windows >>', $windows);
  console.log('$readLater >>', $readLater);

  const SESSION_LIST = {
    session: $sessions,
    window: $windows,
    readLater: $readLater
  }

  const curSessionTabs  = useMemo(() => {
    const _curSessionTabs = SESSION_LIST?.[curSessionType].kv?.[curSessionId]?.tabs || [];
    return _curSessionTabs.filter(_ => !removedMapApi.get(_.id));
  }, [state.curSessionType, state.curSessionId, removedMap])

  useEffect(() => {
    // resetGroupByDomain();
    TabSelect.unSelectAll();
  }, [state.curSessionType, state.curSessionId])

  const domainList = useMemo(() => {
    if(!state.shouldGroupByDomain){
      return [];
    }

    const tabsGroupByDomain: {[key: string]: any[]} = curSessionTabs.reduce((acc, cur) => {
      const _url = new URL(cur.url);
      if(!acc[_url.hostname]){
        acc[_url.hostname] = [];
      }
      acc[_url.hostname].push(cur);
      return acc;
    }, {})

    let _domainList = Object.entries(tabsGroupByDomain)
      .sort((a, b) => a[1].length < b[1].length ? -1 : 1)
      .reduce((acc, cur) => {
        if(cur[1].length > 1){
          acc.push({
            domain: cur[0],
            favicon: cur[1]?.[0]?.favIconUrl,
            tabs: cur[1]
          })
        }else{
          const lastIndex = acc.length - 1;
          if(acc[lastIndex]){
            acc[lastIndex].tabs = acc[lastIndex].tabs.concat(cur[1])
          }else{
            acc.push({
              domain: 'Others',
              type: 'multi',
              tabs: [cur[1]]
            })
          }
        }
        return acc;
      }, []);

    return _domainList.slice(0, 1).concat(_domainList.slice(1).reverse());
  }, [curSessionTabs, state.shouldGroupByDomain])

  const curDomain = useMemo(() => {
    return domainList.some(_ => _.domain === state.curDomain) ? state.curDomain : domainList[0]?.domain
  }, [domainList.length, state.curDomain])

  const { curShownTabs, curShownTabIds } = useMemo(() => {
    let _curShownTabs = curSessionTabs;
    if(state.shouldGroupByDomain && domainList){
      _curShownTabs = domainList?.find(_ => _.domain === curDomain)?.tabs || [];
    }
    return {
      curShownTabs: _curShownTabs,
      curShownTabIds: _curShownTabs.map(_ => _.id)
    };
  }, [curSessionTabs, curDomain])

  const TabSelect = useSelections<number>(curShownTabIds);

  console.log('currentState >>', state);


  useEffect(() => {
    chrome.windows.getAll({populate: true}).then(res => {
      $windows.reset(res);
      setState({
        windowList: res,
        curSessionId: res[0].id
      });
    })

    chrome.storage.local.get([STORAGE_KEY['session'], STORAGE_KEY['readLater']], (res) => {
      console.log('chrome localData >> ', res);

      $sessions.reset(res[STORAGE_KEY['session']]);
      $readLater.reset(res[STORAGE_KEY['readLater']]);
      // setState({
      //   savedSessionList: res.sessions || [],
      //   readLaterList: res.readLater || []
      // })
    })


    // chrome.sessions.getRecentlyClosed((res) => {
    //   console.log('getRecentlyClosed', res);
    // })

    // chrome.tabs.onRemoved.addListener(async (_tabId, _removeInfo) => {
    //   if(_removeInfo.isWindowClosing === true){
    //     const _windowList = state.windowList.filter(_ => _removeInfo.windowId !== _.id);
    //     setState({
    //       windowList: _windowList,
    //       curSessionId: _removeInfo.windowId === state.curSessionId ? _windowList?.[0]?.id : state.curSessionId
    //     })
    //   }else{
    //     // TODO 性能很差 建议用 windowId[] 配合 windowMap{} 来实现一个 useDynamicList
    //     const newWindow = await chrome.windows.get(_removeInfo.windowId, {
    //       populate: true
    //     })
    //     setState(_state => {
    //       const _windowList = _state.windowList.map(_ => _removeInfo.windowId === _.id ? newWindow : _)
    //       return {
    //         windowList: _windowList
    //       };
    //     })
    //   }
    // })
  }, [])

  const closeTabs = () => {
    chrome.tabs.remove(TabSelect.selected);
    TabSelect.selected.forEach((_) => {
      removedMapApi.set(_, true)
    })
    TabSelect.unSelectAll();
  }

  const readLater = async () => {
    const _tabSelected = curShownTabs.filter(_ =>  TabSelect.isSelected(_.id))
    let _list = state.readLaterList?.[0]?.tabs || [];
    const {tsId, ts} = useBaseIdAndTimeStamp();
    // const _readLater = (await chrome.storage.local.get('readLater'))?.readLater || {id: -1, tabs: []};
    _list = _list.concat(_tabSelected.map(_ => ({
      id: `${tsId}_${_.id}`,
      icon: _.favIconUrl,
      title: _.title,
      url: _.url,
      ts: ts
    })))
    const readLaterList = [{id: -1, tabs: _list}];
    await chrome.storage.local.set({readLater: readLaterList});
    setState({
      readLaterList
    })
  }

  function getSelectedTabs(mode?: 'save'){
    const _tabSelected = curShownTabs.filter(_ => TabSelect.selected.includes(_.id))
    if(mode === 'save'){
      // TODO this will be messed if data synced via multi devices
      const {tsId, ts} = useBaseIdAndTimeStamp();
      return _tabSelected.map((_, _index) => ({
        id: `${tsId}-${_index}`,
        icon: _.favIconUrl,
        title: _.title,
        url: _.url,
        ts
      }))
    }
    return _tabSelected;
  }

  const saveToSession = ({id = '', name = ''} = {}) => {
    const _tabs = getSelectedTabs();
    if(id){
      SESSION_LIST["session"].addTabs(id, _tabs);
    }else{
      SESSION_LIST["session"].create({tabs: _tabs})
    }
    TabSelect.unSelectAll();
  }

  // function saveToSession(id, _tabs){
  //   let _list = state.savedSessionList;
  //   if(id){
  //     _list = _list.map((_session) => {
  //       if(_session.id === id){
  //         _session.tabs = _tabs.concat(_session.tabs);
  //         return _session;
  //       }
  //       return _session;
  //     })
  //   }else{
  //     const {tsId, ts} = useBaseIdAndTimeStamp();
  //     _list = _list.concat({
  //       id: tsId,
  //       // name: name || `Untitled ${dayjs(ts).format('YYYY/MM/DD HH:mm')}`,
  //       name: `Untitled ${dayjs(ts).format('YYYY/MM/DD HH:mm')}`,
  //       tabs: _tabs,
  //       ts
  //     })
  //   }
  //
  //   chrome.storage.local.set({
  //     sessions: _list
  //   }).then(() => {
  //     setState({
  //       savedSessionList: _list
  //     })
  //   });
  // }

  function saveToReadLater(_list) {
    const readLaterList = [{id: -1, tabs: _list}];
    chrome.storage.local.set({readLater: readLaterList}).then(() => {
      setState({
        readLaterList
      })
    });
  }


  function deleteSavedTab(){
    const remainTabs = curSessionTabs.filter(_ => !TabSelect.isSelected(_.id))
    if(state.curSessionType === 'readLater'){
      saveToReadLater(remainTabs);
    }else{

    }
  }

  const lookLocalStorage = async () => {
    const res = await chrome.storage.local.get()
    console.log('lookLocalStorage >>', res);
    const res1 = await chrome.storage.local.getBytesInUse()
    console.log('lookLocalStorage >>', res1);
  }

  function resetGroupByDomain() {
    setState({
      shouldGroupByDomain: false,
    })
  }



  return (
    <div className="popup" >
      <div>
        <p>Tab Manager From Ricky's Love ❤️</p>
      </div>
      <div className="main">
        <div className="main-left" >
          <div className="section">
            <p className="title">Windows</p>
            <ul className="list">
              {/*{state.windowList.map((window) => {*/}
              {$windows.list.map((id) => {
                return (
                  <li key={id} className="window-item" onClick={() => {
                    setState({
                      curSessionId: id,
                      curSessionType: 'window',
                    })
                  }}>{id}</li>
                );
              })}
            </ul>
          </div>
          <div className="section">
            <p className="title" onClick={() =>{ setState({ curSessionType: 'readLater', curSessionId: -1 }) }} >Read Later</p>
          </div>
          <div className="section">
            <p className="title">Sessions</p>
            <ul className="session-list">
              {/*{state.savedSessionList.map((session) => {*/}
              {$sessions.list.map((id) => {
                return (
                  <li key={id} className="item" onClick={() => {
                    setState({ curSessionType: 'session', curSessionId: id })
                  }}>{$sessions.kv[id].name}</li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="main-right">
          <div>
            <button onClick={() => {setState({shouldGroupByDomain: true})}} >group by domain</button>
            {!TabSelect.noneSelected ? (
              <>
                <button onClick={readLater} >Read Later</button>
                {state.curSessionType === 'window'? (
                  <>
                    <button onClick={toggleModelShow} >Save To Session</button>
                    <button onClick={closeTabs} >Close</button>
                  </>
                ) : (
                  <button onClick={() => deleteSavedTab()} >Delete</button>
                )}
              </>
            ) : null}
            <button onClick={lookLocalStorage} >Storage Info</button>
          </div>

          {domainList && domainList.length ? (
            <div className="group-by">
              {domainList.map((_, i) => {
                return (
                  <div
                    className="item row"
                    onClick={() => {
                      setState({
                        curDomain: _.domain
                      }) }
                    }>
                    {_.type === 'multi' ? (
                      <div className="favicons row">
                        {_.tabs.map(d => d.favIconUrl && <div key={d.id} style={{width: 9, height: 18}}><img className="favicon-1 flex-1" src={d.favIconUrl} /></div>)}
                      </div>
                    ) : (
                      <img className="favicon" src={_.favicon} />
                    )}
                    <span style={_.type === 'multi' ? {marginLeft: 16} : {}}>{_.tabs.length}</span>
                  </div>
                );
              })}
            </div>
          ) : null}


          <div className="pt-6 pb-6">
            <span
              className={`mr-6 tab-checkbox iconfont ${TabSelect.allSelected ? 'icon-yigouxuan' : 'icon-weigouxuan'}`}
              onClick={(e) => {
                TabSelect.toggleAll();
              }}
            />
            <span>{TabSelect.allSelected ? 'Unselect All' : 'Select All '}</span>
          </div>

          <ul className="tab-list">
            {curShownTabs.map((tab) => {
              // 删除的暂时不显示
              return removedMapApi.get(tab.id) ? null : (
                <li key={tab.id} className="tab-item" >
                  <span
                    className={`tab-checkbox iconfont ${TabSelect.isSelected(tab.id) ? 'icon-yigouxuan' : 'icon-weigouxuan'}`}
                    onClick={(e) => {
                      TabSelect.toggle(tab.id);
                    }}
                  />
                  <div className="tab-title" onClick={() => {
                    chrome.tabs.update(tab.id, {active: true})
                    chrome.windows.update(tab.windowId, {focused: true})
                  }}>
                    <img className="tab-favicon" src={tab.favIconUrl}/>
                    <div className="tab-title-text" >{tab.title}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

      </div>
      <Modal title="保存到收藏" open={modalShow} onOk={async () => {
        const _formData = form.getFieldsValue(true);
        // console.log(JSON.stringify());
        saveToSession({name: _formData.name });
        toggleModelShow();
      }} onCancel={toggleModelShow}>
        <div style={{height: 6}} />
        <Form
          form={form}
          // size="small"
          layout="horizontal"
          onFinish={(values) => {
            console.log('Success:', values);
          }}
        >
          <Form.Item label="名称" name="name">
            <Input placeholder="未命名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default IndexPopup
