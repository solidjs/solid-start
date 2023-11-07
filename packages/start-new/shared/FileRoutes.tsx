import { getRequestEvent, isServer } from "solid-js/web";
import lazyRoute from "./lazyRoute";

import { pageRoutes as routeConfigs } from "./routes";

export function createRoutes() {
  function createRoute(route) {
    return {
      ...route,
      component: lazyRoute(
        route.$component,
        import.meta.env.START_ISLANDS
          ? import.meta.env.MANIFEST["ssr"]
          : import.meta.env.MANIFEST["client"],
        import.meta.env.MANIFEST["ssr"]
      ),
      data: route.$$data ? route.$$data.require().routeData : undefined,
      children: route.children ? route.children.map(createRoute) : undefined
    };
  }
  const routes = routeConfigs.map(createRoute);
  return routes;
}

let routes;
export const FileRoutes = () => {
  return isServer ? getRequestEvent().routes : (routes || (routes = createRoutes()));
};
