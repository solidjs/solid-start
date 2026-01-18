import { getRequestEvent } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";

export function createServerReference(fn: Function, id: string) {
  if (typeof fn !== "function")
    throw new Error("Export from a 'use server' module must be a function");
  let baseURL = import.meta.env.BASE_URL ?? "/";
  if (!baseURL.endsWith("/")) baseURL += "/";

  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return `${baseURL}_server?id=${encodeURIComponent(id)}`;
      }
      if (prop === "GET") return receiver;
      return (target as any)[prop];
    },
    apply(target, thisArg, args) {
      const ogEvt = getRequestEvent();
      if (!ogEvt) throw new Error("Cannot call server function outside of a request");
      const evt = { ...ogEvt };
      evt.locals.serverFunctionMeta = {
        id,
      };
      evt.serverOnly = true;
      return provideRequestEvent(evt, () => {
        return fn.apply(thisArg, args);
      });
    },
  });
}
