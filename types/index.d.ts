interface ManagerState{
  windowList: chrome.windows.Window[];
  savedSessionList: any[];
  readLaterList: any[],

  // curSessionTabs: chrome.tabs.Tab[];  // all tabs in current session
  // curShownTabs: chrome.tabs.Tab[]; // tabs shown in current List
  curSessionType: 'session' | 'window' | 'readLater'
  curSessionId: number | string; // id associated with `curSessionType`

  showDuplicateTabs: boolean;
  shouldGroupByDomain: boolean;
  showSearchResult: boolean;
  searchResult: any[];
  curDomain: string;
  recentClosed: any;
  // [key: string]: any;
}


interface SessionTab {
  id: string;
  favIconUrl: string;
  title: string;
  url: string;
  ts: number;
}

interface YATab {
  id: number;
  wId?: number;
  favIconUrl: string;
  title: string;
  url: string;
  cr: number;
  up: number;
  isClosed?: number;
}


interface Session {
  id: string;
  ts: number;
  name: string;
  tabs: SessionTab[];
}

interface ChromeWindow extends chrome.windows.Window{
  name?: string;
}

interface SessionMap {
  [key: string | number]: Session
}

interface WindowMap {
  [key: string | number]: ChromeWindow
}

function reset(): void;

type ChromeTab = chrome.tabs.Tab;
type $id = number | string;
type $Session = Session | ChromeWindow;
type $Tab = SessionTab | ChromeTab;
type $Tabs = SessionTab[] | ChromeTab[];
