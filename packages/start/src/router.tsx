import clientAssets from "virtual:solid-manifest/client";
import { createComponent, lazy, onCleanup, type Component } from "solid-js";
import { acquireAsset, isServer } from "@solidjs/web";

import { pageRoutes as routeConfigs } from "./server/routes.ts";

const components: Record<string, Component> = {};

/**
 * Ties a route's client CSS lifecycle to the route component: acquire the
 * stylesheets from the client asset manifest on mount, release on route
 * leave. `acquireAsset` ref-counts by href and adopts links however they got
 * into the document (SSR-streamed, injected by Vite's dynamic-import preload
 * helper, or created by another route sharing the stylesheet), so styles
 * from a left route are removed instead of accumulating — with a grace
 * period covering A → B → A navigation. The wrapper is applied on both
 * server and client so the component tree (and with it hydration ids) stays
 * aligned. In dev the map is empty and Vite's own client manages CSS.
 */
function withRouteAssets(src: string, component: Component): Component {
  const entry = (clientAssets as Record<string, { css: string[] }>)[src.split("?")[0]!];
  if (!entry?.css?.length) return component;
  const wrapped: Component & { preload?: unknown } = props => {
    if (!isServer) {
      for (const href of entry.css) {
        onCleanup(acquireAsset({ type: "style", href }));
      }
    }
    return createComponent(component, props as any);
  };
  // Routers drive `preload` (navigation intent) and islands read `moduleUrl`
  // off the component — forward both from the underlying lazy component.
  wrapped.preload = (component as any).preload;
  Object.defineProperty(wrapped, "moduleUrl", {
    get: () => (component as any).moduleUrl,
  });
  return wrapped;
}

function createRoutes() {
  function createRoute(route: any) {
    const component =
      route.$component &&
      (components[route.$component.src] ??= withRouteAssets(
        route.$component.src,
        lazy(route.$component.import, route.$component.src),
      ));

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

/**
 * The file-system route tree, shaped as `@solidjs/router` route definitions.
 * Pass it to the router factory: `createRouter({ routes: fileRoutes })`.
 * Routes are immutable per router instance, so one shared tree serves every
 * request and mount (in dev, route file changes invalidate the module graph
 * and this module re-evaluates).
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/routing/file-routes
 */
export const fileRoutes = /*#__PURE__*/ createRoutes();
