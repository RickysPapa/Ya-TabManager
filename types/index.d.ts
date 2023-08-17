import type { IWindow } from "~lib/new/WindowManager";
import type { ICollectionItem } from "~lib/new/CollectionManager";
export {};
declare global{
  interface ManagerState{
    windows: IWindow[];
    windowList: chrome.windows.Window[];
    savedSessionList: any[];
    readLaterList: any[],

    currentList: ICollectionItem[],
    // curSessionTabs: chrome.tabs.Tab[];  // all tabs in current session
    // curShownTabs: chrome.tabs.Tab[]; // tabs shown in current List
    curSessionType: 'WINDOW' | 'COLLECTION' | 'READ_LATER'
    curSessionId: number | string; // id associated with `curSessionType`
    curSessionIndex: number;


    showDuplicateTabs: boolean;
    shouldGroupByDomain: boolean;
    showSearchResult: boolean;
    searchResult: any[];
    curDomain: string;
    recentClosed: any;
    [key: string]: any;
  }

  interface ITab {
    id: number;
    wId?: number;
    icon: string;
    title: string;
    url: string;
    cr: number;
    up: number;
    isClosed?: number;
  }

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

interface Session<T> {
  id: string;
  ts?: number;
  name?: string;
  tabs: T[];
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
