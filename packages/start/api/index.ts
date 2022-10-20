import { registerApiRoutes } from "./internalFetch";
import { getRouteMatches } from "./router";
import { MatchRoute, Method, Route } from "./types";

// the line below will be replaced by the compiler with a configuration of routes
// based on the files in src/routes
// we have to declare this with `var` so that we can find it even if vite precompiles the code
// @ts-ignore
var api = $API_ROUTES;

// `delete` is a reserved word in JS, so we use `del` instead

function routeToMatchRoute(route: Route): MatchRoute {
  const segments = route.path.split("/").filter(Boolean);

  const params: { type: "*" | ":"; name: string; index: number }[] = [];
  const matchSegments: (string | null)[] = [];
  let score = route.path.endsWith("/") ? 4 : 0;
  let wildcard = false;

  for (const [index, segment] of segments.entries()) {
    if (segment[0] === ":") {
      const name = segment.slice(1);
      score += 3;
      params.push({
        type: ":",
        name,
        index
      });
      matchSegments.push(null);
    } else if (segment[0] === "*") {
      params.push({
        type: "*",
        name: segment.slice(1),
        index
      });
      wildcard = true;
    } else {
      score += 4;
      matchSegments.push(segment);
    }
  }

  return {
    ...route,
    score,
    params,
    matchSegments,
    wildcard
  };
}

const allRoutes = (api as Route[]).map(routeToMatchRoute).sort((a, b) => b.score - a.score);

registerApiRoutes(allRoutes);

export function getApiHandler(url: URL, method: string) {
  return getRouteMatches(allRoutes, url.pathname, method.toUpperCase() as Method);
}

export function isApiRequest(request: Request) {
  let apiHandler = getApiHandler(new URL(request.url), request.method);
  return Boolean(apiHandler);
}

export * from "../server/responses";
export type { APIEvent } from "./types";
