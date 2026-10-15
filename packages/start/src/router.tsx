import { lazy, type Component } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";

import { pageRoutes as routeConfigs } from "./server/routes.ts";
import type { PageEvent } from "./server/types.ts";
import { withRouteChunkReload } from "./shared/route-chunk-reload.ts";

const components: Record<string, Component> = {};

export function createRoutes() {
  function createRoute(route: any) {
    const component =
      route.$component && (components[route.$component.src] ??= lazy(loadComponent(route)));

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

function loadComponent(route: any): () => Promise<any> {
  // A route's chunk can go missing when a deploy replaces it while the page is
  // open. Reloading picks up the new version.
  return !isServer && import.meta.env.PROD && import.meta.env.START_RELOAD_ON_ROUTE_CHUNK_ERROR
    ? withRouteChunkReload(route.$component.import)
    : route.$component.import;
}

let routes: any[];

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/routing/file-routes
 */
export const FileRoutes = isServer
  ? () => (getRequestEvent() as PageEvent).routes
  : () => routes || (routes = createRoutes());
