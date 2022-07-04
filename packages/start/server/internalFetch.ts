import { RequestContext } from "./types";
import { getRouteMatches } from "../api/router";
import type { Method } from "../api";

let apiRoutes;

export const registerApiRoutes = routes => {
  apiRoutes = routes;
};

export function getApiHandler(url: URL, method: string) {
  return getRouteMatches(apiRoutes, url.pathname, method.toLowerCase() as Method);
}

export async function internalFetch(route: string, init: RequestInit) {
  let url = new URL(route, "http://localhost:3000");
  const request = new Request(url.href, init);
  const handler = getApiHandler(url, request.method);
  const response = await handler.handler({ request } as RequestContext, handler.params);
  return response;
}
