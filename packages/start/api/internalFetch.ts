import { FETCH_EVENT } from "../server/types";
import { getRouteMatches } from "./router";
import type { APIEvent, Method } from "./types";

let apiRoutes;

export const registerApiRoutes = routes => {
  apiRoutes = routes;
};

export async function internalFetch(route: string, init: RequestInit) {
  if (route.startsWith("http")) {
    return await fetch(route, init);
  }

  let url = new URL(route, "http://internal");
  const request = new Request(url.href, init);
  const handler = getRouteMatches(apiRoutes, url.pathname, request.method.toUpperCase() as Method);

  let apiEvent: APIEvent = Object.freeze({
    request,
    params: handler.params,
    env: {},
    $type: FETCH_EVENT,
    fetch: internalFetch
  });

  const response = await handler.handler(apiEvent);
  return response;
}
