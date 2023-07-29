
class EventListener {
  listeningEvents: chrome.events.Event<any>[] = [];
  listener = {};

  listen<T>(events: chrome.events.Event<any> | (chrome.events.Event<any> | [event: chrome.events.Event<any>, fun: Function])[], fun: Function){
    let eventList: (chrome.events.Event<any> | [event: chrome.events.Event<any>, fun: Function])[] = [];
    if(Array.isArray(events)){
      eventList = events;
    } else {
      eventList = [events];
    }

    eventList.forEach((event) => {
      let eventIndex = -1;
      let eventInstance: chrome.events.Event<any> = null;
      let eventCallBack: Function = fun;
      if(Array.isArray(event)){
        eventIndex = this.listeningEvents.indexOf(event[0]);
        eventInstance = event[0];
        eventCallBack = event[1];
      }else{
        eventIndex = this.listeningEvents.indexOf(event);
        eventInstance = event;
      }

      if(eventIndex === -1){
        eventIndex = this.listeningEvents.push(eventInstance) - 1;
        this.listener[eventIndex] = [eventCallBack];
        eventInstance.addListener((...args) => {
          this.listener[eventIndex].forEach(_fun => _fun.apply(null, args))
        })
      }else{
        this.listener[eventIndex].push(eventCallBack);
      }
    })
  }
}

export default new EventListener();
