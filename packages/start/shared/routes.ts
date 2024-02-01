import fileRoutes from "vinxi/routes";

interface Route {
  path: string;
  id: string;
  type: "page";
  children?: Route[];
}

declare module "vinxi/routes" {
  export interface Register {
    route: {
      path: string;
      type: "api" | "page";
      children?: Route[];
    };
  }
}

export const pageRoutes = defineRoutes((fileRoutes as unknown as Route[]).filter(o => o.type === "page"));

function defineRoutes(fileRoutes: Route[]) {
  function processRoute(routes: Route[], route: Route, id: string, full: string) {
    const parentRoute = Object.values(routes).find(o => {
      return id.startsWith(o.id + "/");
    });

    if (!parentRoute) {
      routes.push({ ...route, id, path: id.replace(/\/\([^)/]+\)/g, "") });
      return routes;
    }
    processRoute(
      parentRoute.children || (parentRoute.children = []),
      route,
      id.slice(parentRoute.id.length),
      full
    );

    return routes;
  }

  return fileRoutes
    .sort((a, b) => a.path.length - b.path.length)
    .reduce((prevRoutes, route) => {
      return processRoute(prevRoutes, route, route.path, route.path);
    }, []);
}

