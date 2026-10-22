// @ts-expect-error
import fileRoutes from "solid-start:routes";
import { createRouter } from "radix3";

import type { Route } from "./routes.ts";
import type { FetchEvent } from "./types.ts";

// The API router lives apart from `pageRoutes` so the client bundle, which
// imports `pageRoutes`, doesn't include radix3 or build this router.
const router = createRouter({
  routes: (fileRoutes as unknown as Route[]).reduce(
    (memo, route) => {
      if (!containsHTTP(route)) return memo;
      const path = route.path
        .replace(/\([^)/]+\)/g, "")
        .replace(/\/+/g, "/")
        .replace(/\*([^/]*)/g, (_, m) => `**:${m}`)
        .split("/")
        .map(s => (s.startsWith(":") || s.startsWith("*") ? s : encodeURIComponent(s)))
        .join("/");
      if (/:[^/]*\?/g.test(path)) {
        throw new Error(`Optional parameters are not supported in API routes: ${path}`);
      }
      if (memo[path]) {
        throw new Error(
          `Duplicate API routes for "${path}" found at "${memo[path]!.route.path}" and "${
            route.path
          }"`,
        );
      }
      memo[path] = { route };
      return memo;
    },
    {} as Record<string, { route: Route }>,
  ),
});

function containsHTTP(route: Route) {
  return (
    route["$HEAD"] ||
    route["$GET"] ||
    route["$POST"] ||
    route["$PUT"] ||
    route["$PATCH"] ||
    route["$DELETE"] ||
    route["$OPTIONS"]
  );
}

export function matchAPIRoute(
  path: string,
  method: string,
):
  | {
      params?: Record<string, any>;
      handler: {
        import: () => Promise<Record<string, (e: FetchEvent) => Promise<any>>>;
      };
      isPage: boolean;
    }
  | undefined {
  const match = router.lookup(path);
  if (match && match.route) {
    const route = match.route;

    // Find the appropriate handler for the HTTP method
    const handler = method === "HEAD" ? route.$HEAD || route.$GET : route[`$${method}`];

    if (handler === undefined) return;

    // Check if this is a page route. SPA builds leave page components out of
    // the server routes, so this can't depend on `$component`.
    const isPage = route.page === true;

    // Return comprehensive route information
    return {
      handler,
      params: match.params,
      isPage,
    };
  }

  return undefined;
}
