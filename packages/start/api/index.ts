import { registerApiRoutes } from "./internalFetch";
import { getRouteMatches } from "./router";
import { MatchRoute, Method, Route } from "./types";

// the line below will be replaced by the compiler with a configuration of routes
// based on the files in src/routes
// we have to declare this with `var` so that we can find it even if vite precompiles the code
// @ts-ignore
var api = $API_ROUTES;

// This is copied from https://github.com/solidjs/solid-router/blob/main/src/utils.ts
function expandOptionals(pattern: string): string[] {
  let match = /(\/?\:[^\/]+)\?/.exec(pattern);
  if (!match) return [pattern];

  let prefix = pattern.slice(0, match.index);
  let suffix = pattern.slice(match.index + match[0].length);
  const prefixes: string[] = [prefix, (prefix += match[1])];

  // This section handles adjacent optional params. We don't actually want all permuations since
  // that will lead to equivalent routes which have the same number of params. For example
  // `/:a?/:b?/:c`? only has the unique expansion: `/`, `/:a`, `/:a/:b`, `/:a/:b/:c` and we can
  // discard `/:b`, `/:c`, `/:b/:c` by building them up in order and not recursing. This also helps
  // ensure predictability where earlier params have precidence.
  while ((match = /^(\/\:[^\/]+)\?/.exec(suffix))) {
    prefixes.push((prefix += match[1]));
    suffix = suffix.slice(match[0].length);
  }

  return expandOptionals(suffix).reduce<string[]>(
    (results, expansion) => [...results, ...prefixes.map(p => p + expansion)],
    []
  );
}

function routeToMatchRoute(route: Route): MatchRoute {
  const segments = route.path.split("/").filter(Boolean);

  const params: { type: "*" | ":"; name: string; index: number }[] = [];
  const matchSegments: (string | null)[] = [];
  let score = 0;
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
      score -= 1;
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

const allRoutes = (api as Route[])
  .flatMap(route => {
    const paths = expandOptionals(route.path);
    return paths.map(path => ({ ...route, path }));
  })
  .map(routeToMatchRoute)
  .sort((a, b) => b.score - a.score);

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
