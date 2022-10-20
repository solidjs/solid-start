import { useServerContext } from "../server/ServerContext";
import { FETCH_EVENT } from "../server/types";
import { getRouteMatches } from "./router";
import type { APIEvent, Method } from "./types";

let apiRoutes;

export const registerApiRoutes = routes => {
  apiRoutes = routes;
};

// Headers from the original page GET request that should not
// be copied over to the fetch request
const SKIPPED_HEADERS = ["Accept"];

// https://fetch.spec.whatwg.org/#forbidden-header-name
const FORBIDDEN_HEADERS = [
  `Accept-Charset`,
  `Accept-Encoding`,
  `Access-Control-Request-Headers`,
  `Access-Control-Request-Method`,
  `Connection`,
  `Content-Length`,
  `Cookie`,
  `Cookie2`,
  `Date`,
  `DNT`,
  `Expect`,
  `Host`,
  `Keep-Alive`,
  `Origin`,
  `Referer`,
  `Set-Cookie`,
  `TE`,
  `Trailer`,
  `Transfer-Encoding`,
  `Upgrade`,
  `Via`
];

export async function internalFetch(route: string, init: RequestInit = {}) {
  if (route.startsWith("http")) {
    return await fetch(route, init);
  }

  const headers = new Headers(useServerContext().request?.headers);
  for (const header of SKIPPED_HEADERS) {
    headers.delete(header);
  }

  const initHeaders = new Headers(init.headers);
  for (const header of FORBIDDEN_HEADERS) {
    initHeaders.delete(header);
  }
  for (const [name, value] of initHeaders) {
    headers.set(name, value);
  }

  const credentials = init.credentials ?? "same-origin";
  if (credentials === "omit") {
    headers.delete("cookie");
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
