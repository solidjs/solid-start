import { createMiddleware as createServerMiddleware, eventHandler } from "vinxi/runtime/server";
import { createFetchEvent } from "./fetch-event";
import { FetchEvent } from "./types";

export function createMiddleware(fn: ({ forward }) => (event: FetchEvent) => Promise<Response>) {
  return createServerMiddleware(({ forward }) => {
    const fetchEventHandler = fn({ forward });
    return eventHandler(h3event => {
      const fetchEvent = createFetchEvent(h3event);
      return fetchEventHandler(fetchEvent);
    });
  });
}
