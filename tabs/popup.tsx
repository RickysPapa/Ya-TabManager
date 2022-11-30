import { useEffect, useState, useMemo, useRef } from "react";
import {useSetState, useToggle} from 'ahooks';
import {Modal, Form, Input } from 'antd';
import {useBaseIdAndTimeStamp} from './utils';
import dayjs from 'dayjs';
import './popup.less';

const SESSION_TYPE_LIST = {
  session: 'savedSessionList',
  window: 'windowList',
  readLater: 'readLaterLst'
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
    curSessionTabs: [],
    curShownTabs: [],
    // For User-Action
    tabSelected: [],
    domainList: null,
    curDomainIndex: 0,
  });

  const [form] = Form.useForm();
  const [modalShow, {toggle: toggleModelShow}] = useToggle(false);


  useEffect(() => {
    chrome.storage.local.get('sessions', (res) => {
      console.log('sessions', res);
      setState({savedSessionList: res.sessions || []})
    })

    chrome.windows.getAll({populate: true}).then(res => {
      setState({
        windowList: res,
        curSessionId: res[0].id
      });
      console.log(res);
    })

    chrome.sessions.getRecentlyClosed((res) => {
      console.log('getRecentlyClosed', res);
    })
  }, [])

  const closeTabs = async () => {
    await chrome.tabs.remove(state.tabSelected);
  }

  const readLater = async () => {
    const _tabSelected = state.curShownTabs.filter(_ => state.tabSelected.includes(_.id))
    const _list = await chrome.storage.local.get('readLater') || [];
    const readLater = _list.concat(_tabSelected.map(_ => ({
      icon: _.favIconUrl,
      title: _.title,
      url: _.url,
      ts: Date.now()
    })))
    await chrome.storage.local.set({
      readLater: readLater
    });
  }

  const saveToSession = async ({id, name}) => {
    const _tabSelected = state.curShownTabs.filter(_ => state.tabSelected.includes(_.id))
    let _list = (await chrome.storage.local.get('sessions'))?.sessions || [];
    // TODO this will be messed if data synced via multi devices
    const {tsId, ts} = useBaseIdAndTimeStamp();
    const _tabs = _tabSelected.map((_, _index) => ({
      id: `${tsId}-${_index}`,
      icon: _.favIconUrl,
      title: _.title,
      url: _.url,
      ts
    }));

    if(id){
      _list = _list.map((_session) => {
        if(_session.id === id){
          _session.tabs = _tabs.concat(_session.tabs);
          return _session;
        }
        return _session;
      })
    }else{
      _list = _list.concat({
        id: tsId,
        name: name || `Untitled${日期}`,
        tabs: _tabs,
      })
    }

    await chrome.storage.local.set({
      sessions:
    });
  }

  const lookLocalStorage = async () => {
    const res = await chrome.storage.local.get()
    console.log('lookLocalStorage >>', res);
    const res1 = await chrome.storage.local.getBytesInUse()
    console.log('lookLocalStorage >>', res1);
  }


  const resetGroupByDomain = () => {
    setState({
      domainList: null,
      curDomainIndex: 0,
    })
  }

  const groupByDomain = () => {
    const tabsGroupByDomain: {[key: string]: any[]} = state.curSessionTabs.reduce((acc, cur) => {
      const _url = new URL(cur.url);
      if(!acc[_url.hostname]){
        acc[_url.hostname] = [];
      }
      acc[_url.hostname].push(cur);
      return acc;
    }, {})

    let domainList = Object.entries(tabsGroupByDomain)
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
    console.log(domainList);

    domainList = domainList.slice(0, 1).concat(domainList.slice(1).reverse());

    setState({
      domainList,
      curShownTabs: domainList[state.curDomainIndex]?.tabs
    })
  }

  useEffect(() => {
    const _curShownTabs = state[SESSION_TYPE_LIST[state.curSessionType]].find(_ => (_.id || _.ts) === state.curSessionId)
    resetGroupByDomain();
    setState({
      curSessionTabs: _curShownTabs?.tabs || [],
      curShownTabs: _curShownTabs?.tabs || []
    })
  }, [state.curSessionType, state.curSessionId])


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
              {state.windowList.map((window) => {
                return (
                  <li key={window.id} className="window-item" onClick={() => {
                    setState({
                      curSessionId: window.id,
                      curSessionType: 'window',
                    })
                  }}>{window.id}</li>
                );
              })}
            </ul>
          </div>
          <div className="section">
            <p className="title" onClick={() =>{ setState({ curSessionType: 'readLater' }) }} >Read Later</p>
          </div>
          <div className="section">
            <p className="title">Sessions</p>
            <ul className="session-list">
              {state.savedSessionList.map((session) => {
                return (
                  <li key={session.ts} className="item" onClick={() => {
                    setState({ curSessionType: 'session', curSessionId: session.ts })
                  }}>{session.name}</li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="main-right">
          <div>
            <button onClick={groupByDomain} >group by domain</button>
            {state.tabSelected.length ? (
              <>
                <button onClick={readLater} >Read Later</button>
                <button onClick={toggleModelShow} >Save To Session</button>
                <button onClick={closeTabs} >Close All</button>
              </>
            ) : null}
            <button onClick={lookLocalStorage} >Storage Info</button>
          </div>
          {state.domainList && state.domainList.length ? (
            <div className="group-by">
              {state.domainList.map((_, i) => {
                return (
                  <div
                    className="item row"
                    onClick={() => {
                      setState({
                        curShownTabs: state.domainList[i].tabs
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
          <ul className="tab-list">
            {state.curShownTabs.map((tab) => {
              return (
                <li key={tab.id} className="tab-item" >
                  <span
                    className={`tab-checkbox iconfont ${state.tabSelected.includes(tab.id) ? 'icon-yigouxuan' : 'icon-weigouxuan'}`}
                    onClick={(e) => {
                      if(state.tabSelected.includes(tab.id)){
                        setState({
                          tabSelected: state.tabSelected.filter(_ => _ !== tab.id)
                        })
                      }else {
                        setState({
                          tabSelected: [...state.tabSelected, tab.id]
                        })
                      }
                    }}
                  />
                  <div className="tab-title" onClick={() => {
                    chrome.tabs.update(tab.id, {active: true})
                  }}>
                    <img className="tab-favicon" src={tab.favIconUrl}/>
                    <p>{tab.title}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

      </div>
      <Modal title="保存到收藏" open={modalShow} onOk={async () => {
        console.log(JSON.stringify(form.getFieldsValue(true)));
        // await saveToSession();
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
