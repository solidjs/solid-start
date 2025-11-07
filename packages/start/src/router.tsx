import { getManifest } from "solid-start:get-manifest";
import { getRequestEvent, isServer } from "solid-js/web";

import lazyRoute from "./server/lazyRoute.tsx";
import { pageRoutes as routeConfigs } from "./server/routes.ts";
import type { PageEvent } from "./server/types.ts";

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
        route.$component && lazyRoute(route.$component, getManifest("client"), getManifest("ssr")),
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
