// @ts-expect-error
import fileRoutes from "solid-start:routes";

export interface Route {
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
  $OPTIONS?: any;
}

export const pageRoutes = defineRoutes((fileRoutes as unknown as Route[]).filter(o => o.page));

function defineRoutes(fileRoutes: Route[]) {
  function processRoute(routes: Route[], route: Route, id: string, full: string) {
    const parentRoute = Object.values(routes).find(o => {
      return id.startsWith(o.id + "/");
    });

    if (!parentRoute) {
      routes.push({
        ...route,
        id,
        path: id.replace(/\([^)/]+\)/g, "").replace(/\/+/g, "/"),
      });
      return routes;
    }
    processRoute(
      parentRoute.children || (parentRoute.children = []),
      route,
      id.slice(parentRoute.id.length),
      full,
    );

    return routes;
  }

  return fileRoutes
    .sort((a, b) => a.path.length - b.path.length)
    .reduce((prevRoutes: Route[], route) => {
      return processRoute(prevRoutes, route, route.path, route.path);
    }, []);
}
