import { getRouteMatches } from "./router";
import type { Method, ApiFetchEvent } from "./types";

let apiRoutes;

export const registerApiRoutes = routes => {
  apiRoutes = routes;
};

export async function internalFetch(route: string, init: RequestInit) {
  let url = new URL(route, "http://localhost:3000");
  const request = new Request(url.href, init);
  const handler = getRouteMatches(apiRoutes, url.pathname, request.method.toLowerCase() as Method);
  const response = await handler.handler({ request, params: handler.params } as ApiFetchEvent);
  return response;
}
