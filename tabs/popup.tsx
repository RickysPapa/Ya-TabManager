import { useEffect, useState, useMemo } from "react";
import {useSetState} from 'ahooks';
import './popup.less';

const IndexPopup = () => {
  const [state, setState] = useSetState<ManagerState>({
    tabs: [],
    windows: [],
    curTabs: [],
    curWindowTabs: null,
    curWindowId: 0,
    tabSelected: [],
    domainList: [],
    curDomainIndex: 0,
  });



  useEffect(() => {
    // chrome.tabs.query({}).then((res) => {
    //   setTabs(res);
      // console.log(res);
    // })
    // console.log('seesions', chrome.sessions);
    chrome.windows.getAll({populate: true}).then(res => {
      // setWindows(res);
      setState({
        windows: res,
        curWindowId: res[0].id
      });
      console.log(res);
    })

    chrome.sessions.getRecentlyClosed((res) => {
      console.log('getRecentlyClosed', res);
    })
  }, [])

  useEffect(() => {
    const curWindowTabs = state.windows.find(item => item.id === state.curWindowId)?.tabs || [];
    setState({
      curWindowTabs,
      curTabs: curWindowTabs
    })
  }, [state.curWindowId])

  const readLater = async () => {
    const _tabSelected = state.curTabs.filter(_ => state.tabSelected.includes(_.id))
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

  const lookLocalStorage = async () => {
    const res = await chrome.storage.local.get()
    console.log('lookLocalStorage >>', res);
    const res1 = await chrome.storage.local.getBytesInUse()
    console.log('lookLocalStorage >>', res1);
  }

  const groupByDomain = () => {
    const tabsGroupByDomain: [string, [any]] = state.curWindowTabs.reduce((acc, cur) => {
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
      curTabs: domainList[state.curDomainIndex]?.tabs
    })
  }

  return (
    <div className="popup" >
      <div>
        <p>Tab Manager From Ricky's Love ❤️</p>
      </div>
      <div className="main">
        <ul className="window-list">
          {state.windows.map((window) => {
            return (
              <li key={window.id} className="window-item" onClick={() => {
                setState({
                  curWindowId: window.id,
                  tabSelected: [],
                })
              }}>{window.id}</li>
            );
          })}
        </ul>
        <div className="main-right">
          <div>
            <button onClick={groupByDomain} >group by domain</button>
            <button onClick={readLater} >Read Later</button>
            <button onClick={lookLocalStorage} >Storage Info</button>
          </div>
          <div className="group-by">
            {state.domainList.map((_, i) => {
              return (
                <div
                  className="item row"
                  onClick={() => {
                    setState({
                      curTabs: state.domainList[i].tabs
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
          <ul className="tab-list">
            {state.curTabs.map((tab) => {
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
    </div>
  )
}

export default IndexPopup
