/// <reference types="vinxi/types/server" />
import { sharedConfig } from "solid-js";
import fileRoutes from "vinxi/routes";
// @ts-ignore
import { provideRequestEvent } from "solid-js/web/storage";
import { eventHandler } from "vinxi/server";
import { getFetchEvent } from "../server/fetchEvent";
import { APIEvent } from "../server/types";

export default eventHandler(h3Event => {
  const event = getFetchEvent(h3Event);
  if (event) {
    return provideRequestEvent(event, async () => {
      const match = matchAPIRoute(new URL(event.request.url).pathname, event.request.method);
      if (match) {
        const mod = await match.handler.import();
        const fn = mod[event.request.method];
        (event as APIEvent).params = match.params;
        // @ts-ignore
        sharedConfig.context = { event };
        const res = fn(event);
        if (res === undefined && event.request.method !== "GET") {
          return new Response(null, { status: 204 });
        }
        return res;
      }
    });
  }
});

interface Route {
  path: string;
  id: string;
  type: "api";
  children?: Route[];
}

type MatchRoute = Route & {
  score: number;
  params: {
    type: "*" | ":";
    name: string;
    index: number;
  }[];
  matchSegments: (string | null)[];
  wildcard: boolean;
};

const apiRoutes = defineAPIRoutes((fileRoutes as unknown as Route[]).filter(o => o.type === "api"));

// TODO Simplify this mess:
function matchAPIRoute(path: string, method: string) {
  const segments = path.replace(import.meta.env.SERVER_BASE_URL, "").split("/").filter(Boolean);

  routeLoop: for (const route of apiRoutes) {
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

    const handler = route[`$${method}`];
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

function defineAPIRoutes(routes: Route[]) {
  return routes
    .flatMap(route => {
      const paths = expandOptionals(route.path);
      return paths.map(path => ({ ...route, path }));
    })
    .map(routeToMatchRoute)
    .sort((a, b) => b.score - a.score);
}

// This is copied from https://github.com/solidjs/solid-router/blob/main/src/utils.ts
function expandOptionals(pattern: string): string[] {
  let match = /(\/?\:[^\/]+)\?/.exec(pattern);
  if (!match) return [pattern];

  let prefix = pattern.slice(0, match.index);
  let suffix = pattern.slice(match.index + match[0].length);
  const prefixes: string[] = [prefix, (prefix += match[1])];

  // This section handles adjacent optional params. We don't actually want all permuations since
  // that will lead to equivalent apiRwhich have the same number of params. For example
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
      if (!segment.match(/^\(.+\)$/)) {
        matchSegments.push(segment);
      }
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
