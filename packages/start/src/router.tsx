import { lazy, type Component } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";

import { pageRoutes as routeConfigs } from "./server/routes.ts";
import type { PageEvent } from "./server/types.ts";

const components: Record<string, Component> = {};

export function createRoutes() {
  function createRoute(route: any) {
    const component =
      route.$component && (components[route.$component.src] ??= lazy(route.$component.import));

    return {
      ...route,
      ...(route.$$route ? route.$$route.require().route : undefined),
      info: {
        ...(route.$$route ? route.$$route.require().route.info : {}),
        filesystem: true,
      },
      component,
      children: route.children ? route.children.map(createRoute) : undefined,
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
