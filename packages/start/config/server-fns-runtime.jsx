import { getRequestEvent } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";
import { cloneEvent } from "../server/middleware";

export function createServerReference(fn, id, name) {
  const baseURL = import.meta.env.SERVER_BASE_URL;
  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return `${baseURL}/_server?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
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
