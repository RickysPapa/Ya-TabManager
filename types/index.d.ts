interface ManagerState{
  tabs: [];
  windows: chrome.windows.Window[];
  curTabs: chrome.tabs.Tab[],
  curWindowId: number;
  tabSelected: number[];
  domainList: any[];
  [key: string]: any;
}
