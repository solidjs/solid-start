import { getRequestEvent } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";
import { registerServerFunction } from "./manifest.ts";

function enhanceServerFunction<T extends any[], R>(
  id: string,
  fn: (...args: T) => Promise<R>,
) {
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
    apply(target, thisArg, args: T) {
      const ogEvt = getRequestEvent();
      if (!ogEvt)
        throw new Error("Cannot call server function outside of a request");
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

export function createServerReference<T extends any[], R>(
  id: string,
  fn: (...args: T) => Promise<R>,
) {
  let baseURL = import.meta.env.BASE_URL ?? "/";
  if (!baseURL.endsWith("/")) baseURL += "/";

  return registerServerFunction(id, enhanceServerFunction(id, fn));
}

export function createServerFunction<T extends any[], R>(
  id: string,
  fn: () => Promise<(...args: T) => Promise<R>>,
) {
  let instance = fn();
  return enhanceServerFunction(id, async (...args: T) => {
    return (await instance)(...args);
  });
}
