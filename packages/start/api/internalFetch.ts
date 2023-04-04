import { FETCH_EVENT } from "../server/types";
import { getRouteMatches } from "./router";
import type { APIEvent, MatchRoute, Method } from "./types";

let apiRoutes: MatchRoute[];

export const registerApiRoutes = (routes: MatchRoute[]) => {
  apiRoutes = routes;
};

export async function internalFetch(route: string, init: RequestInit, env: Env = {}, locals: Record<string, unknown> = {}) {
  if (route.startsWith("http")) {
    return await fetch(route, init);
  }

  let url = new URL(route, "http://internal");
  const request = new Request(url.href, init);
  const handler = getRouteMatches(apiRoutes, url.pathname, request.method.toUpperCase() as Method);

  if (!handler) {
    throw new Error(`No handler found for ${request.method} ${request.url}`);
  }

  let apiEvent: APIEvent = Object.freeze({
    request,
    params: handler.params,
    clientAddress: "127.0.0.1",
    env,
    locals,
    $type: FETCH_EVENT,
    fetch: internalFetch
  });

  const response = await handler.handler(apiEvent);
  return response;
}
