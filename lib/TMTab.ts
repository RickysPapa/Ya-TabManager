
export function simplify(tab: ChromeTab): YATab{
  return {
    id: tab.id.toString(),
    wId: tab.windowId,
    title: tab.title,
    url: tab.url,
    icon: tab.favIconUrl,
    position: tab.index,
    cr: Date.now(),
    up: Date.now(),
    status: 0,
  };
}

export default {
  simplify
}
