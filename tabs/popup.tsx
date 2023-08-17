import { useEffect, useState, useMemo, useRef, DOMElement, useCallback } from "react";
import {DeleteOutlined, HistoryOutlined} from '@ant-design/icons';
import EventEmitter from 'eventemitter3';
import WindowManager from '~/lib/new/WindowManager'
import TabManager from '~/lib/new/TabManager'
import CollectionManager from '~/lib/new/CollectionManager'
import LeftPanelItem from './components/left-panel-item';
import type { IWindow } from '~/lib/new/WindowManager'
import {db} from '../lib/db';
// import ClosedTabStorage from '../lib/ClosedTabStorage';
import StorageListener from '../lib/StorageListener';
import debounce from 'lodash/debounce';
// import { useSetState, useToggle, useMap, useSelections } from 'ahooks';
// import {Modal, Form, Input, Upload } from 'antd';

import useSetState from 'ahooks/es/useSetState';
import { useAsyncEffect } from 'ahooks';
import useToggle from 'ahooks/es/useToggle';
import useMap from 'ahooks/es/useMap';
import useSelections from 'ahooks/es/useSelections';
import useKeyPress from 'ahooks/es/useKeyPress';
import Modal from 'antd/es/modal';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import Button from 'antd/es/button';
import Upload from 'antd/es/upload';
// import Result from 'antd/es/result';
import { useBaseIdAndTimeStamp, lookLocalStorage, localGet } from "~lib/utils";
import './popup.less';
// import { InboxOutlined } from '@ant-design/icons';
import { useSessionList } from "~lib/hooks";
import TMSearch from './components/search';
import { simplify } from "~lib/TMTab";
// import dayjs from "dayjs";

const EE = new EventEmitter()

let test = 1;
const { Dragger } = Upload;
const SESSION_TYPE_LIST = {
  session: 'savedSessionList',
  window: 'windowList',
  readLater: 'readLaterList'
}

const extractItemData = ({ title, url, favIconUrl }) => ({
  title, url, icon: favIconUrl
})



const STORAGE_KEY = {
  session: '$session',
  readLater: '$readLater'
}

let currentWindowWithDetail;
const _startTime = Date.now();
chrome.windows.getAll({populate: true}).then((_w) => {
  console.log('chrome.windows.getAll >>', Date.now() - _startTime, _w);
  currentWindowWithDetail = _w;
});

const IndexPopup = () => {
  const [state, setState] = useSetState<ManagerState>({
    // Total Data
    windows: [],
    windowsClosed: [],

    collections: [],

    currentListType: '',
    curSessionIndex: 0,
    currentList: [],

    windowList: currentWindowWithDetail,
    savedSessionList: [],
    readLaterList: [],
    // For current data
    curSessionType: 'WINDOW',
    curSessionId: 0,

    shouldGroupByDomain: false,
    showDuplicateTabs: false,
    showSearchResult: false,
    searchResult: [],
    // curTabs: [],
    // curShownTabs: [],
    // For User-Action
    // tabSelected: [],
    recentClosed: [],
    // domainList: null,
    curDomain: '',
  });

  const {curSessionType, curSessionId, curSessionIndex} = state;
  const [form] = Form.useForm();
  const [modalShow, {toggle: toggleModelShow}] = useToggle(false);
  const [showHistory, {toggle: toggleHistory}] = useToggle(false);
  const [removedMap, removedMapApi] = useMap([]);
  const [openedUrlMap, openedTabMapApi] = useMap([]);

  const [uploadState, setUploadState] = useSetState({
    open: false,
    success: false
  })

  useEffect(() => {
    WindowManager.init({
      onUpdate: ({ current, closed }) => {
        console.log('pupup >> WindowManager onUpdate', current, closed);
        // setState({ windows: current, windowsClosed: closed, curSessionId: current?.[0].id });
        setState({ windows: current, curSessionId: current?.[0].id });
      }
    });
  }, [])

  useAsyncEffect(async function*() {
    // const closeTabs = await localGet('$closed');
    // setState({
    //   recentClosed: closeTabs
    // });

    await CollectionManager.init({
      onUpdate: ({ collections }) => {
        setState({
          collections
        })
      }
    });

    await TabManager.init({ isWorker: false });
  }, []);

  console.log('collections >>>', state.collections);


  // const $windows = useSessionList({chromeStorageKey: '$window'});
  const $windows = useSessionList<ChromeTab>({initialData: currentWindowWithDetail});
  const $sessions = useSessionList<YATab>({chromeStorageKey: '$session'});
  const $readLater = useSessionList<YATab>({chromeStorageKey: '$readLater', initialData: [{
    id: 'default',
    tabs: []
  }]});
  const $windowsRef = useRef($windows);
  $windowsRef.current = $windows;

  // console.log('state.windowList', state.windowList);
  // console.log('$sessions >>', $sessions);
  // console.log('$windows >>', $windows);
  // console.log('state.closeTabs >>', state.recentClosed);
  // console.log('$readLater >>', $readLater);

  const DIR_LIST = {
    // session: $sessions,
    WINDOW: state.windows,
    COLLECTION: state.collections,
    // readLater: $readLater
  }

  // useEffect(() => {
    // EE.once('global-data-ready', currentWindowWithDetail);
  // })

  const {windowSearchSource, windowSearchSourceData} = useMemo(() => {
    return $windows.list.reduce((acc, cur) => {
      console.log('windowSearchSource > ', cur.tabs);
      acc.windowSearchSource = acc.windowSearchSource.concat(cur.tabs.map(_ => _.title + _.url + ''))
      acc.windowSearchSourceData = acc.windowSearchSourceData.concat(cur.tabs)
      return acc;
    }, {
      windowSearchSource: [],
      windowSearchSourceData: []
    })
  }, [$windows.list])

  // 当前窗口数据
  const curDir = useMemo(() => {
    const _curDir = DIR_LIST[curSessionType][curSessionIndex];
    return DIR_LIST[curSessionType][curSessionIndex];
  }, [
    state.windows, state.collections, state.curSessionType, curSessionIndex
  ])

  useEffect(() => {
    if(curSessionType === 'WINDOW' && curDir?.id){
      console.log('999999', curDir);
      TabManager.getClosedTabs(curDir.id, (docs) => {
        console.log('9999999', docs);
        setState({
          recentClosed: docs
        })
      });
    }
  }, [curSessionType, curDir?.id])

  const curTabs = useMemo(() => {
    let _curTabs = [];
    if(curDir){
      if(curSessionType === 'WINDOW'){
        _curTabs = curDir.tabs;
      }else {
        _curTabs = curDir.items;
      }
    }
    return (_curTabs || []).filter(_ => !removedMapApi.get(_.id));
  }, [state.windows, state.curSessionType, curSessionIndex, removedMap, $windows.list])


  useEffect(() => {
    resetGroupByDomain();
    setState({
      showDuplicateTabs: false
    })
  }, [state.curSessionType, state.curSessionIndex])

  useEffect(() => {
    TabSelect.setSelected([]);
  }, [state.curSessionType, state.curSessionIndex, state.curDomain])


  const domainList = useMemo(() => {
    // 为什么需要实时计算，而不保存到 state 缓存？
    // 考虑到有删除操作的时候还要重新计算，逻辑比较麻烦，同时可能导致两次 setState？（存疑）
    // 后续可以考虑自己写一个 deps，用钩子的方式执行副作用（不过可以先了解一下 react 的 deps 一定是 state 修改完成后才执行，还是拿着将要变的值触发回调的）
    if(!state.shouldGroupByDomain){
      return [];
    }

    const tabsGroupByDomain: {[key: string]: any[]} = curTabs.reduce((acc, cur) => {
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
  }, [curTabs, state.shouldGroupByDomain])

  const [duplicateList, preferDuplicateIds] = useMemo(() => {
    if(!state.showDuplicateTabs) return [[], []];
    const _urlCount = curTabs.reduce((acc, cur) => {
      if(!acc[cur.url]){
        acc[cur.url] = [];
      }
      acc[cur.url].push(cur);
      return acc;
    }, {})

    let _duplicateList = [];
    let _selectedIds = [];
    Object.values(_urlCount)
      .filter(_ => (_ as []).length > 1)
      .forEach((_tabs: ChromeTab[]) => {
        _selectedIds.push(...(_tabs.map(_ => _.id).slice(0, -1)));
        _duplicateList.push(..._tabs);
      });

    return [_duplicateList, _selectedIds];
  }, [state.showDuplicateTabs, curSessionType, curSessionIndex, curTabs]);

  useEffect(() => {
    if(state.showDuplicateTabs){
      TabSelect.setSelected(preferDuplicateIds);
    }
  }, [state.showDuplicateTabs, preferDuplicateIds])

  const curDomain = useMemo(() => {
    return domainList.some(_ => _.domain === state.curDomain) ? state.curDomain : domainList[0]?.domain
  }, [domainList.length, state.curDomain])

  const { curShownTabs, curShownTabIds } = useMemo(() => {
    let _curShownTabs = curTabs;
    if(state.shouldGroupByDomain && domainList){
      _curShownTabs = domainList?.find(_ => _.domain === curDomain)?.tabs || [];
    }
    if(state.showDuplicateTabs){
      _curShownTabs = duplicateList;
    }
    if(state.showSearchResult){
      _curShownTabs = state.searchResult;
    }
    return {
      curShownTabs: _curShownTabs,
      curShownTabIds: _curShownTabs.map(_ => _.id)
    };
  }, [curTabs, curDomain, state.showDuplicateTabs, state.searchResult, state.showSearchResult])

  const TabSelect = useSelections<number | string>(curShownTabIds);

  // console.log('TabSelect >>', TabSelect.selected);
  // console.log('currentState >>', state);


  useEffect(() => {
    console.log('didMount >>', Date.now());


    chrome.tabs.onCreated.addListener((tab) => {
      // console.log('onCreated >>', tab);
      $windowsRef.current.insertTab(tab.windowId, tab.index, tab);
    })
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      // console.log('onUpdated >>', tabId, changeInfo, tab);
      console.log('$trigger onRemoved');
      if(changeInfo.status !== 'complete'){
        $windowsRef.current.updateTab(tab.windowId, tab);
      }
    })
    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      // console.log('onRemoved >>', tabId, removeInfo);
      $windowsRef.current.removeTab(removeInfo.windowId, tabId);
    })

    const resetWindow = (tabId, info) => {
      console.log('$trigger resetWindow');
      const wid = info.windowId || info.newWindowId || info.oldWindowId || info.id;
      chrome.windows.get(wid, {populate: true}).then((_) => {
        $windowsRef.current.resetTabs(wid, _.tabs);
      });
    }

    chrome.tabs.onMoved.addListener(debounce(resetWindow, 500));
    chrome.tabs.onAttached.addListener(resetWindow)
    chrome.tabs.onDetached.addListener(resetWindow);

    chrome.windows.onCreated.addListener((_w) => {
      console.log('windows.onCreated popup.ts >>', _w);
      $windowsRef.current.createSession({name: '', tabs: [], ..._w});
    })

    try{
      setTimeout(() => {
        $sessions.reset(JSON.parse(localStorage.getItem(STORAGE_KEY['session'])));
        $readLater.reset(JSON.parse(localStorage.getItem(STORAGE_KEY['readLater'])));
      }, 150)
    }catch (e){
    }

    // StorageListener.listen('$closed', (newValue) => {
    //   console.log('storage.onChanged $closed >> ', newValue);
    //   setState({
    //     recentClosed: newValue
    //   })
    // })
  }, [])

  // useKeyPress(() => true, (e) => {
  //   console.log(e.key);
  // }, {
  //   exactMatch: true,
  //   // useCapture: true
  // });


  const closeTabs = () => {
    chrome.tabs.remove(TabSelect.selected as number[]);
    TabSelect.selected.forEach((_) => {
      removedMapApi.set(_, true)
    })
    TabSelect.unSelectAll();
  }

  const saveToReadLater = async (close = false) => {
    const tabs = getSelectedTabs();
    await CollectionManager.readLater(tabs.map(_ => ({
      title: _.title,
      url: _.url,
      icon: _.favIconUrl
    })))
    // $readLater.addTabs('default', tabs.map(simplify));
    if(close){
      // closeTabs();
    }else{
      TabSelect.unSelectAll();
    }
  }

  function getSelectedTabs(mode: string = 'save') {
    const _tabSelected = curShownTabs.filter(_ => TabSelect.selected.includes(_.id))
    if(mode === 'save'){
      // TODO this will be messed if data synced via multi devices
      const {tsId, ts} = useBaseIdAndTimeStamp();
      return _tabSelected.map((_, _index) => ({
        id: `${tsId}-${_index}`,
        favIconUrl: _.favIconUrl,
        title: _.title,
        url: _.url,
        ts
      }));
    }
    return _tabSelected;
  }

  const saveToSession = ({id = '', name = ''} = {}, { close = false } = {}) => {
    const _tabs = getSelectedTabs();
    if(id){
      CollectionManager.insertItem(_tabs.map(extractItemData), { cid: id })
      // DIR_LIST['session'].addTabs(id, _tabs.map(simplify));
    }else{
      CollectionManager.insertItem(_tabs.map(extractItemData), { cName: name })
      // DIR_LIST['session'].createSession({name, tabs: _tabs.map(simplify)})
    }
    if(close){
      closeTabs();
    }else{
      TabSelect.unSelectAll();
    }
  }

  function _getCurSessionInstance(){
    return DIR_LIST[curSessionType];
  }

  // function __getCurSessionTabs(){
  //   return DIR_LIST[curSessionType].kv[curSessionId].tabs;
  // }


  function deleteSavedTab(){
    DIR_LIST[curSessionType].removeTabs(curSessionId, TabSelect.selected);
    TabSelect.selected.forEach((_) => {
      removedMapApi.set(_, true)
    })
    TabSelect.unSelectAll();
  }


  function resetGroupByDomain() {
    setState({
      shouldGroupByDomain: false,
    })
  }

  function exportData(){
    const _data = {
      sessions: $sessions.list,
      readLater: $readLater.list
    };

    const blob = new Blob([JSON.stringify(_data, null, 2)], {
      type: "application/json",
    });

    chrome.downloads.download({
      url: URL.createObjectURL(blob),
      filename: `ya-tab-manager\ backup.json`
    }).catch(e => {
      throw e;
    });
  }

  // function openTabs({tabs: SessinonTab[] = [], newWindow: boolean = false} = {}){
  function openTabs({tabs = null, newWindow = false, active = false} = {}) {
    const _tabs = tabs ? tabs : getSelectedTabs();
    if(_tabs){
      if(newWindow){
        let _targetWindowId = null;
        function _onUpdated(_tabId, changeInfo, tab){
          if(changeInfo.title && _targetWindowId && tab.windowId === _targetWindowId && tab.index !== 0){
            console.log(JSON.stringify(changeInfo));
            chrome.tabs.discard(_tabId);
          }
        }
        chrome.tabs.onUpdated.addListener(_onUpdated);

        chrome.windows.create({
          url: _tabs.map(_ => _.url)
        }).then((_window) => {
          _targetWindowId = _window.id;
          setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(_onUpdated);
          }, 3000)
        });
      }else{
        const isOnlyOne = _tabs.length === 1;
        _tabs.forEach((_) => {
          chrome.tabs.create({
            active: isOnlyOne ? active : false,
            url: _.url
          })
        })
      }
    }
  }

  function openSession(){
    openTabs({
      newWindow: true,
      tabs: $sessions.getTabs(state.curSessionId),
    })
  }

  // console.log('history', ClosedTabStorage.ts, ClosedTabStorage.getList(curSessionId), ClosedTabStorage.kv);
  // console.log('chrome.window.render >>>>', currentWindowWithDetail);
  console.log('render >>', Date.now() - _startTime, curShownTabs);
  // return (<div>111</div>);

  const switchList = useCallback((sType, targetIndex: number) => {
    if(sType === 'COLLECTION'){
      const _tIndex = state.collections.length > targetIndex ? targetIndex : 0;
      const _dir = state.collections[_tIndex];
      CollectionManager.ensureCollectionData(_dir.id).then(() => {
        setState({
          curSessionType: sType,
          curSessionIndex: _tIndex,
        })
      })
    }else{
      const _tIndex = state.windows.length > targetIndex ? targetIndex : 0;
      // const _dir = state.collections[_tId];
      setState({
        curSessionType: sType,
        curSessionIndex: _tIndex,
      })
    }
  }, [state.collections, state.windows, curSessionIndex])

  return (
    <div className="popup" >
      <div>
        <span>Tab Manager From Ricky's Love ❤️</span>
        <DeleteOutlined />
        <TMSearch
          dataSource={windowSearchSourceData}
          onResult={(res) => {
            setState({
              showSearchResult: res !== false,
              searchResult: res || []
            })
          }}
        />
        <button onClick={exportData} >Export</button>
        <button onClick={() => setUploadState({open: true})}>Import</button>
        <button onClick={() => {
          chrome.tabs.create({
            active: true,
            pinned: true,
            index: 1,
            url: `chrome-extension://${chrome.runtime.id}/tabs/popup.html`
          })
        }}>OpenInWindow</button>
      </div>

      <div>
        {/*{JSON.stringify(state.windows)}*/}
      </div>

      <div className="main">
        <div className="main-left" >
          <div className="section">
            <p className="title">Windows</p>
            <ul className="list">
              {state.windows.map((item, wIndex) => {
                return <LeftPanelItem
                  active={wIndex === curSessionIndex}
                  key={item.id}
                  data={item}
                  onClick={switchList.bind(null, 'WINDOW', wIndex)}
                  remove={() => WindowManager.removeWindow(item.id)}
                  updateInfo={(data) => {
                    WindowManager.updateWindowInfo(item.id, data)
                  }}
                />
              })}
            </ul>
          </div>
          <div className="section">
            <p className="title" onClick={() =>{ setState({ curSessionType: 'READ_LATER', curSessionId: 'default'}) }} >Read Later</p>
          </div>
          <div className="section">
            <p className="title">收藏夹</p>
            <ul className="session-list">
              {state.collections.map(( collection, cIndex ) => {
                return <LeftPanelItem
                  active={cIndex === curSessionIndex}
                  key={collection.id}
                  data={collection}
                  onClick={switchList.bind(null, 'COLLECTION', cIndex)}
                />
              })}
            </ul>
          </div>
        </div>
        <div className="main-right">
          <div>
            <button onClick={() => {setState({shouldGroupByDomain: true})}} >group by domain</button>
            <button onClick={() => {setState({showDuplicateTabs: true})}} >Delete duplicate tabs</button>
            {!TabSelect.noneSelected ? (
              <>
                {state.curSessionType !== 'readLater' ? (
                  <>
                    <button onClick={() => saveToReadLater()} >Read Later</button>
                    <button onClick={() => saveToReadLater(true)} >Read Later & Close</button>
                  </>
                ) : null}
                {state.curSessionType === 'window'? (
                  <>
                    <button onClick={toggleModelShow} >Save To Session</button>
                    <button onClick={toggleModelShow} >Save To Session & Close</button>
                    <button onClick={closeTabs} >Close</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openTabs()} >Open</button>
                    <button onClick={() => openTabs({newWindow: true})} >Open In New Window</button>
                    <button onClick={() => deleteSavedTab()} >Delete</button>
                  </>
                )}
              </>
            ) : null}
            {state.curSessionType === 'session' ? (
              <button onClick={() => openSession()} >Open Session</button>
            ) : null}
            <button onClick={lookLocalStorage} >Storage Info</button>
          </div>

          {domainList && domainList.length ? (
            <div className="group-by">
              {domainList.map((_, i) => {
                return (
                  <div
                    className="item row"
                    style={_.type === 'multi' ? { minWidth: _.tabs.length * 9 + 18 }: {}}
                    onClick={() => {
                      setState({
                        curDomain: _.domain
                      }) }
                    }>
                    {_.type === 'multi' ? (
                      <div className="favicons row" >
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


          <div className="pt-6 pb-6 row space-between">
            <div onClick={(e) => { TabSelect.toggleAll(); }} >
              <span className={`mr-6 tab-checkbox iconfont ${TabSelect.allSelected ? 'icon-yigouxuan' : 'icon-weigouxuan'}`} />
              <span>{TabSelect.allSelected ? 'Unselect All' : 'Select All '}</span>
            </div>
            <div onClick={(e) => {
              toggleHistory();
            }} >
              <HistoryOutlined />
              <span>History</span>
            </div>
          </div>

          <div className="relative" >
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
                      if(curSessionType === 'WINDOW'){
                        chrome.tabs.update((tab as ChromeTab).id, {active: true})
                        chrome.windows.update((tab as ChromeTab).windowId, {focused: true})
                      }else{
                        openTabs({tabs: [tab], active: true});
                      }
                    }}>
                      <img className="tab-favicon" src={tab.icon}/>
                      <div className="tab-title-text" >{tab.title}</div>
                      <button></button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <ul className="history-list" >
              {(state.recentClosed || []).map(tab => {
                return (
                  <li key={tab.id} className="tab-item" >
                    <span
                      className={`tab-checkbox iconfont ${TabSelect.isSelected(tab.id) ? 'icon-yigouxuan' : 'icon-weigouxuan'}`}
                      onClick={(e) => {
                        TabSelect.toggle(tab.id);
                      }}
                    />
                    <div className="tab-title" onClick={() => {
                      openTabs({tabs: [tab], active: true});
                    }}>
                      <img className="tab-favicon" src={tab.favIconUrl}/>
                      <div className="tab-title-text" >{tab.title}</div>
                      <button></button>
                    </div>
                  </li>
                );
              })}
              <li>Show More</li>
            </ul>
          </div>
        </div>

      </div>
      <Modal
        title="保存到收藏"
        open={modalShow}
        onCancel={toggleModelShow}
        footer={[
          <Button key="save" type="primary" onClick={() => {
            const _formData = form.getFieldsValue(true);
            saveToSession(_formData);
            toggleModelShow();
          }}>
            保存
          </Button>,
          <Button key="saveAndClose" type="primary" onClick={() => {
            const _formData = form.getFieldsValue(true);
            saveToSession(_formData, { close: true });
            toggleModelShow();
          }} > 保存并关闭 </Button>,
        ]}
      >
        <div style={{height: 6}} />
        <Form
          form={form}
          // size="small"
          layout="horizontal"
          onFinish={(values) => {
            console.log('Success:', values);
          }}
          onValuesChange={(changedValues, allValues) => {
            console.log(changedValues, allValues);
          }}
        >
          <Form.Item label="选择收藏夹" name="id">
            <Select
              placeholder="创建新的收藏夹"
              defaultValue=""
              // style={{ width: 120 }}
              options={[{label: '新建收藏夹', value: ''}].concat($sessions.list.map(_session => ({
                label: _session?.name || '未命名',
                value: _session.id
              })))}
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.id !== currentValues.id}
          >
            {({ getFieldValue }) =>
              !getFieldValue('id') ? (
                <Form.Item name="name" label="收藏夹名称">
                  <Input />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="导入"
        open={uploadState.open}
        onCancel={() => setUploadState({open: false})}
        footer={null}
      >
        <div style={{height: 6}} />
        {uploadState.success ? (
          <>
            <p>Successfully Import</p>
            <p>Now you can check it</p>
          </>
        ) : (
          <Dragger {...{
            accept: '.json',
            showUploadList: false,
            name: 'file',
            onChange(info) {
              const { status } = info.file;
              if (status === 'done') {
                console.log(info.file, info.fileList);
                info.file.originFileObj.text().then(res => {
                  const _data = JSON.parse(res);
                  $sessions.reset(_data.sessions);
                  $readLater.reset(_data.readLater);
                  setUploadState({ success: true })
                  console.log(_data);
                })
              }
            },
          }}>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
          </Dragger>
        )}
      </Modal>
    </div>
  )
}

export default IndexPopup
