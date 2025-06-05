import { getRequestEvent, isServer } from "solid-js/web";
import lazyRoute from "./server/lazyRoute.jsx";
import type { PageEvent } from "./server/types.js";
import { pageRoutes as routeConfigs } from "./server/routes.js";

export function createRoutes() {
  function createRoute(route: any) {
    return {
      ...route,
      ...(route.$$route ? route.$$route.require().route : undefined),
      info: {
        ...(route.$$route ? route.$$route.require().route.info : {}),
        filesystem: true
      },
      component:
        route.$component &&
        lazyRoute(
          route.$component,
          import.meta.env.START_ISLANDS
            ? import.meta.env.MANIFEST["server"]
            : import.meta.env.MANIFEST["client"],
          import.meta.env.MANIFEST["server"]
        ),
      children: route.children ? route.children.map(createRoute) : undefined
    };
  }
  const routes = routeConfigs.map(createRoute);
  return routes;
}

let routes: any[];

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/routing/file-routes
 */
export const FileRoutes = isServer
  ? () => (getRequestEvent() as PageEvent).routes
  : () => routes || (routes = createRoutes());
