import { registerApiRoutes } from "../server/server-functions/server";
import { RequestContext } from "../server/types";
import { getRouteMatches } from "./router";

// the line below will be replaced by the compiler with a configuration of routes
// based on the files in src/routes
// we have to declare this with `var` so that we can find it even if vite precompiles the code
// @ts-ignore
var api = $API_ROUTES;

// `delete` is a reserved word in JS, so we use `del` instead
export type Method = "get" | "post" | "put" | "del" | "patch";
type Handler = (
  ctx: RequestContext,
  params: Record<string, string>
) => Response | Promise<Response>;

type Route = { path: string; children?: Route[] } & { [method in Method]?: Handler | "skip" };
export type MatchRoute = ReturnType<typeof routeToMatchRoute>;

function routeToMatchRoute(route: Route) {
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
  return getRouteMatches(allRoutes, url.pathname, method.toLowerCase() as Method);
}
