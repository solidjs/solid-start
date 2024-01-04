import { getRequestEvent } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";
import { cloneEvent } from "../server/middleware";

export function createServerReference(fn, id, name) {
  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return `/_server?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
      }
    },
    apply(target, thisArg, args) {
      const ogEvt = getRequestEvent();
      if (!ogEvt) throw new Error("Cannot call server function outside of a request");
      const evt = cloneEvent(ogEvt);
      evt.serverOnly = true;
      return provideRequestEvent(evt, () => {
        return fn.apply(thisArg, args);
      });
    }
  });
}
