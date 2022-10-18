import { useServerContext } from "../server/ServerContext";
import { FETCH_EVENT } from "../server/types";
import { getRouteMatches } from "./router";
import type { APIEvent, Method } from "./types";

let apiRoutes;

export const registerApiRoutes = routes => {
  apiRoutes = routes;
};

const FORWARDED_HEADERS = ["cookie"];

export async function internalFetch(route: string, init: RequestInit = {}) {
  if (route.startsWith("http")) {
    return await fetch(route, init);
  }

  const headers = new Headers(init.headers);
  const requestHeaders = useServerContext().request?.headers;
  if (requestHeaders) {
    for (const header of FORWARDED_HEADERS) {
      if (requestHeaders.has(header)) {
        headers.set(header, requestHeaders.get(header));
      }
    }
  }

  const url = new URL(route, "http://internal");
  const request = new Request(url.href, {
    ...init,
    headers
  });
  const handler = getRouteMatches(apiRoutes, url.pathname, request.method.toUpperCase() as Method);

  const apiEvent: APIEvent = Object.freeze({
    request,
    params: handler.params,
    env: {},
    $type: FETCH_EVENT,
    fetch: internalFetch
  });

  const response = await handler.handler(apiEvent);
  return response;
}
