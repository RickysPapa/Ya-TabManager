
class EventListener {
  listeningEvents: chrome.events.Event<any>[] = [];
  listener = {};

  listen<T extends Function>(events: chrome.events.Event<T> | (chrome.events.Event<T> | [event: chrome.events.Event<T>, fun: Function])[], fun: Function){
    let eventList: (chrome.events.Event<T> | [event: chrome.events.Event<T>, fun: Function])[] = [];
    if(Array.isArray(events)){
      eventList = events;
    } else {
      eventList = [events];
    }

    eventList.forEach((event) => {
      let eventIndex = -1;
      let eventInstance: chrome.events.Event<T> = null;
      let customEventCallBack: Function = null;
      if(Array.isArray(event)){
        eventIndex = this.listeningEvents.indexOf(event[0]);
        eventInstance = event[0];
        customEventCallBack = event[1];
      }else{
        eventIndex = this.listeningEvents.indexOf(event);
        eventInstance = event;
      }

      if(eventIndex === -1){
        eventIndex = this.listeningEvents.push(eventInstance) - 1;
        this.listener[eventIndex] = customEventCallBack ? [customEventCallBack, fun] : [fun];
        // TODO TS Syntax Error
        // @ts-ignore
        eventInstance.addListener((...args)  => {
          this.listener[eventIndex].forEach(_fun => _fun.apply(null, args))
        })
      }else{
        if(customEventCallBack){
          this.listener[eventIndex].push(customEventCallBack);
        }
        this.listener[eventIndex].push(fun);
      }
    })
  }
}

export default new EventListener();
