import { getRequestEvent, isServer } from "solid-js/web";
import lazyRoute from "./lazyRoute";

import type { PageEvent } from "../server/types";
import { Route, pageRoutes as routeConfigs } from "./routes";

export function createRoutes() {
  function createRoute(route: Route): any {
    return {
      ...route,
      ...(route.$$route ? route.$$route.require().route : undefined),
      info: {
        ...(route.$$route ? route.$$route.require().route.info : {}),
        filesystem: true
      },
      component: route.$component
        ? lazyRoute(
            route.$component,
            import.meta.env.START_ISLANDS
              ? import.meta.env.MANIFEST["ssr"]
              : import.meta.env.MANIFEST["client"],
            import.meta.env.MANIFEST["ssr"]
          )
        : undefined,
      children: route.children ? route.children.map(createRoute) : undefined,
      ...(route.slots && {
        slots: Object.entries<Route>(route.slots).reduce(
          (acc, [slot, route]) => {
            acc[slot] = createRoute(route);
            return acc;
          },
          {} as Record<string, any>
        )
      })
    };
  }
  const routes = routeConfigs.map(createRoute);
  return routes;
}

let routes: any[];
export const FileRoutes = isServer
  ? () => (getRequestEvent() as PageEvent).routes
  : () => routes || (routes = createRoutes());
