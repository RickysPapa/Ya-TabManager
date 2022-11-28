import { useEffect, useState } from "react";
import './popup.less';


function IndexPopup() {
  const [data, setData] = useState("")
  const [tabs, setTabs] = useState([]);
  const [windows, setWindows] = useState([]);

  useEffect(() => {
    chrome.tabs.query({}).then((res) => {
      setTabs(res);
    })
    // console.log('seesions', chrome.sessions);
    // chrome.sessions.getRecentlyClosed((res) => {
    //   console.log(res);
    // })

  }, [])


  return (
    <div className="popup" >
      <button onClick={() => {

        chrome.tabs.create({
          active: true,
          pinned: true,
          index: 1,
          url: `chrome-extension://${chrome.runtime.id}/tabs/popup.html`
        })
      }}>aaaa</button>
      <ul className="tab-list">

      </ul>
      <ul className="tab-list">
        {tabs.map((tab) => {
          return (
            <li key={tab.id} className="tab-item" onClick={() => {
              chrome.tabs.update(tab.id, {active: true})
            }}>{tab.title}</li>
          );
        })}
      </ul>
    </div>
  )
}

export default IndexPopup
