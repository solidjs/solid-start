import { getRequestEvent } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";
import { registerServerFunction } from "./registration.ts";
import { serverFunctionURL } from "./url.ts";

interface Registration<T extends any[], R> {
  id: string;
  fn: (...args: T) => Promise<R>;
}

export function createServerReference<T extends any[], R>(
  id: string,
  fn: (...args: T) => Promise<R>,
) {
  const registration: Registration<T, R> = { id, fn };
  registerServerFunction(id, fn);
  return registration;
}

export function cloneServerReference<T extends any[], R>({ id, fn }: Registration<T, R>) {
  if (typeof fn !== "function")
    throw new Error("Export from a 'use server' module must be a function");
  const url = serverFunctionURL(id);

  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return url;
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
        return fn.apply(thisArg, args as T);
      });
    },
  });
}
