
export function simplify(tab: ChromeTab): YATab{
  return {
    id: tab.id,
    wId: tab.windowId,
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    cr: Date.now(),
    up: Date.now(),
    isClosed: 0,
  };
}

export default {
  simplify
}
