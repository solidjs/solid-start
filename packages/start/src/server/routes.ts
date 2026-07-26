/// <reference types="filesystem-routes/types" />
import fileRoutes, { pageRoutes as nestedPageRoutes } from "virtual:file-routes";
import { createRouter } from "radix3";

import type { FetchEvent } from "./types.ts";

interface Route {
  path: string;
  id: string;
  children?: Route[];
  page?: boolean;
  $component?: any;
  $HEAD?: any;
  $GET?: any;
  $POST?: any;
  $PUT?: any;
  $PATCH?: any;
  $DELETE?: any;
}

/**
 * The page routes, nested and stripped of `(group)` segments by the
 * file-routes delivery adapter. API routes are matched off the flat manifest
 * below, which keeps every route — pages, handlers and modules that are both.
 */
export const pageRoutes = nestedPageRoutes as unknown as Route[];

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
    route["$DELETE"]
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

    // Check if this is a page route
    const isPage = route.page === true && route.$component !== undefined;

    // Return comprehensive route information
    return {
      handler,
      params: match.params,
      isPage,
    };
  }

  return undefined;
}
