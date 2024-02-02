/// <reference types="vinxi/types/server" />
import { createRouter } from "radix3";
import { sharedConfig } from "solid-js";
import fileRoutes from "vinxi/routes";

// @ts-ignore
import { provideRequestEvent } from "solid-js/web/storage";
import { eventHandler } from "vinxi/server";
import { getFetchEvent } from "../server/fetchEvent";
import { APIEvent } from "../server/types";

export default eventHandler(h3Event => {
  const event = getFetchEvent(h3Event);
  const match = matchAPIRoute(new URL(event.request.url).pathname, event.request.method);
  if (match) {
    return provideRequestEvent(event, async () => {
      const mod = await match.handler.import();
      const fn = mod[event.request.method];
      (event as APIEvent).params = match.params;
      // @ts-ignore
      sharedConfig.context = { event };
      const res = await fn(event);
      if (res === undefined && event.request.method !== "GET") {
        throw new Error(
          `API handler for ${event.request.method} "${event.request.url}" did not return a response.`
        );
      }
      return res;
    });
  }
});

interface Route {
  path: string;
  id: string;
  type: "api" | "page";
  children?: Route[];
}

const router = createRouter({
  routes: (fileRoutes as unknown as Route[]).reduce((memo, route) => {
    if (route.type !== "api") return memo;
    const path = route.path.replace(/\(.*\)\/?/g, "");
    if (memo[path]) {
      throw new Error(
        `Duplicate API routes for "${path}" found at "${memo[path].route.path}" and "${route.path}"`
      );
    }
    memo[path] = { route };
    return memo;
  }, {} as Record<string, { route: Route }>)
});

function matchAPIRoute(path: string, method: string) {
  const match = router.lookup(path);
  if (match) {
    const handler = match.route[`$${method}`];
    if (handler === "skip" || handler === undefined) return;
    return {
      handler,
      params: match.params
    };
  }
}
