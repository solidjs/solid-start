import { createFetchEvent } from "@solidjs/start/server";
import { FetchEvent } from "@solidjs/start/server/types";
import { createAppEventHandler, eventHandler } from "vinxi/runtime/server";

export function createMiddleware(fn: ({ forward }) => (event: FetchEvent) => Promise<Response>) {
  return app => {
    const handler = fn({ forward: event => prevHandler(event) });
    const prevHandler = createAppEventHandler([...app.h3App.stack], {});

    app.h3App.stack.unshift({
      route: "/",
      match: undefined,
      handler: eventHandler(h3event => {
        const fetchEvent = createFetchEvent(h3event);
        return handler(fetchEvent);
      })
    });
  };
}
