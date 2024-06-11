import { createRouter } from "radix3";
import fileRoutes from "vinxi/routes";

export interface Route {
  path: string;
  id: string;
  children?: Route[];
  slots?: Record<string, Route>;
  page?: boolean;
  $component?: any;
  $$route?: any;
  $GET?: any;
  $POST?: any;
  $PUT?: any;
  $PATCH?: any;
  $DELETE?: any;
}

declare module "vinxi/routes" {
  export interface Register {
    route: {
      path: string;
      children?: Route[];
    };
  }
}

export const pageRoutes = defineRoutes((fileRoutes as unknown as Route[]).filter(o => o.page));

function defineRoutes(fileRoutes: Route[]) {
  function processRoute(routes: Route[], route: Route, id: string, full: string) {
    const parentRoute = Object.values(routes).find(o => {
      return id.startsWith(o.id + "/");
    });

    // Route is a leaf segment
    if (!parentRoute) {
      routes.push({
        ...route,
        id,
        path: id
          // strip out escape group for escaping nested routes - e.g. foo(bar) -> foo
          .replace(/\/\([^)/]+\)/g, "")
          .replace(/\([^)/]+\)/g, "")
      });

      return routes;
    }

    const idWithoutParent = id.slice(parentRoute.id.length);

    // Route belongs to a slot
    if (idWithoutParent.startsWith("/@")) {
      let slotRoute = parentRoute;
      let idWithoutSlot = idWithoutParent;

      // Drill down through nested slots
      // Recursing would nest via 'children' but we want to nest via 'slots',
      // so this is handled as a special case
      while (idWithoutSlot.startsWith("/@")) {
        const slotName = /\/@([^/]+)/g.exec(idWithoutSlot)![1]!;

        const slots = (slotRoute.slots ??= {});

        idWithoutSlot = idWithoutSlot.slice(slotName.length + 2);

        // Route is a slot definition
        if (idWithoutSlot === "") {
          const slot = { ...route };
          delete (slot as any).path;
          slots[slotName] = slot;

          return routes;
        }

        slotRoute = slots[slotName] ??= {} as any;
      }

      processRoute((slotRoute.children ??= []), route, idWithoutSlot, full);
    }
    // Route just has a parent
    else {
      processRoute((parentRoute.children ??= []), route, idWithoutParent, full);
    }

    return routes;
  }

  return fileRoutes
    .sort((a, b) => a.path.length - b.path.length)
    .reduce((prevRoutes: Route[], route) => {
      return processRoute(prevRoutes, route, route.path, route.path);
    }, []);
}

export function matchAPIRoute(path: string, method: string) {
  const match = router.lookup(path);
  if (match && match.route) {
    const handler = match.route[`$${method}`];
    if (handler === undefined) return;
    return {
      handler,
      params: match.params
    };
  }
}

function containsHTTP(route: Route) {
  return route["$GET"] || route["$POST"] || route["$PUT"] || route["$PATCH"] || route["$DELETE"];
}

const router = createRouter({
  routes: (fileRoutes as unknown as Route[]).reduce(
    (memo, route) => {
      if (!containsHTTP(route)) return memo;
      let path = route.path
        .replace(/\/\([^)/]+\)/g, "")
        .replace(/\([^)/]+\)/g, "")
        .replace(/\*([^/]*)/g, (_, m) => `**:${m}`);
      if (/:[^/]*\?/g.test(path)) {
        throw new Error(`Optional parameters are not supported in API routes: ${path}`);
      }
      if (memo[path]) {
        throw new Error(
          `Duplicate API routes for "${path}" found at "${memo[path]!.route.path}" and "${route.path}"`
        );
      }
      memo[path] = { route };
      return memo;
    },
    {} as Record<string, { route: Route }>
  )
});
