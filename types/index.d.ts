interface Session {

}

interface ManagerState{
  windowList: chrome.windows.Window[];
  savedSessionList: any[];
  readLaterList: any[],

  curSessionTabs: chrome.tabs.Tab[];  // all tabs in current session
  curShownTabs: chrome.tabs.Tab[]; // tabs shown in current List
  curSessionType: 'session' | 'window' | 'readLater'
  curSessionId: number; // id associated with `curSessionType`

  tabSelected: number[];
  domainList: any[];
  curDomainIndex: number;
  // [key: string]: any;
}
