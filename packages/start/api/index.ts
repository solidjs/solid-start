import { RequestContext } from "../server/types";

// the line below will be replaced by the compiler with a configuration of routes
// based on the files in src/routes
// we have to declare this with `var` so that we can find it even if vite precompiles the code
// @ts-ignore
var api = $API_ROUTES;

type Method = "get" | "post" | "put" | "delete" | "patch";
type Handler = (
  ctx: RequestContext,
  params: Record<string, string>
) => Response | Promise<Response>;

type Route = { path: string; children?: Route[] } & { [method in Method]?: Handler | "skip" };
type MatchRoute = ReturnType<typeof routeToMatchRoute>;

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

function getRouteMatches(routes: MatchRoute[], path: string, method: Method) {
  const segments = path.split("/").filter(Boolean);

  routeLoop: for (const route of routes) {
    const matchSegments = route.matchSegments;

    if (
      segments.length < matchSegments.length ||
      (!route.wildcard && segments.length > matchSegments.length)
    ) {
      continue;
    }

    for (let index = 0; index < matchSegments.length; index++) {
      const match = matchSegments[index];
      if (!match) {
        continue;
      }

      if (segments[index] !== match) {
        continue routeLoop;
      }
    }

    const handler = route[method];
    if (handler === "skip" || handler === undefined) {
      return;
    }

    const params: Record<string, string> = {};
    for (const { type, name, index } of route.params) {
      if (type === ":") {
        params[name] = segments[index];
      } else {
        params[name] = segments.slice(index).join("/");
      }
    }

    return { handler, params };
  }
}

const allRoutes = (api as Route[]).map(routeToMatchRoute).sort((a, b) => b.score - a.score);

export function getApiHandler(url: URL, method: string) {
  return getRouteMatches(allRoutes, url.pathname, method.toLowerCase() as Method);
}
