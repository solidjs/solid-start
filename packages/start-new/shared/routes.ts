import fileRoutes, { Route } from "vinxi/routes";

declare module "vinxi/routes" {
  export interface Register {
    route: {
      path: string;
      type: "api" | "page";
      children?: Route[];
    };
  }
}

const defineRoutes = (fileRoutes: Route[]) => {
  function processRoute(routes: Route[], route: Route, id: string, full: string) {
    const parentRoute = Object.values(routes).find(o => {
      // if (o.id.endsWith("/index")) {
      // 	return false;
      // }
      return id.startsWith(o.path + "/");
    });

    if (!parentRoute) {
      routes.push({ ...route, path: id });
      return routes;
    }
    processRoute(
      parentRoute.children || (parentRoute.children = []),
      route,
      id.slice(parentRoute.path.length),
      full
    );

    return routes;
  }

  return fileRoutes
    .sort((a, b) => a.path.length - b.path.length)
    .reduce((prevRoutes, route) => {
      return processRoute(prevRoutes, route, route.path, route.path);
    }, []);
};

export const pageRoutes = defineRoutes(fileRoutes.filter(o => o.type === "page"));
export const apiRoutes = fileRoutes.filter(o => o.type === "api");
