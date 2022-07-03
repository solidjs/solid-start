import { MatchRoute, Method } from "./types";

export function getRouteMatches(routes: MatchRoute[], path: string, method: Method) {
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
