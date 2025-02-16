import { getRequestEvent } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";
import { cloneEvent } from "../server/fetchEvent";

export function createServerReference(fn: Function, id: string, name: string) {
  if (typeof fn !== "function") throw new Error("Export from a 'use server' module must be a function");
  const baseURL = import.meta.env.SERVER_BASE_URL;
  // @tanstack/server-functions-plugin contructs the id from the filename + function name eg src_lib_api_ts--getStory_query
  // So we extract the name by splitting on --
  // This feels flaky and we should rather try and get the function name directly from the plugin
  // but this requires a change in the plugin
  const functionName = id.split("--").pop() || id;
  const functionPath = `${baseURL}/_server/${encodeURIComponent(functionName)}/`;

  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop === "url") {
        return `${functionPath}/?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
      }
      if (prop === "GET") return receiver;
      return (target as any)[prop];
    },
    apply(target, thisArg, args) {
      const ogEvt = getRequestEvent();
      if (!ogEvt) throw new Error("Cannot call server function outside of a request");
      const evt = cloneEvent(ogEvt);
      evt.locals.serverFunctionMeta = {
        id: id + "#" + name,
      };
      evt.serverOnly = true;
      return provideRequestEvent(evt, () => {
        return fn.apply(thisArg, args);
      });
    }
  });
}
