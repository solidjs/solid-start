/// <reference path="../server/types.tsx" />

// @ts-expect-error
var routesConfig = $ROUTES_CONFIG;

export const fileRoutes = routesConfig.routes;
export const routeLayouts = routesConfig.routeLayouts as {
  [key: string]: { layouts: string[]; id: string };
};

/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */

const FileRoutes = () => {
  return fileRoutes;
};

export default FileRoutes;
