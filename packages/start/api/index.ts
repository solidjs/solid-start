import type { RequestContext } from "../server/types";

// the line below will be replaced by the compiler with a configuration of routes
// based on the files in src/routes
// @ts-ignore

// the line below will be replaced by the compiler with a configuration of routes
// based on the files in src/routes
// we have to keep this var so that we can find it even if vite precompiles the code
// @ts-ignore
var api = $API_ROUTES;

export function getApiHandler(url: URL, method: string) {
  let apiRoute = api.find(({ path }) => url.pathname === path.replace(/\/$/, ""));
  if (apiRoute) {
    const apiMethod = method.toLowerCase();
    if (apiRoute[apiMethod]) {
      return apiRoute[apiMethod];
    }
  }
}

