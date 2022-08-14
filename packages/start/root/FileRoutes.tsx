/// <reference path="../server/types.tsx" />

// @ts-expect-error
var routesConfig = $ROUTES_CONFIG;

/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */

const FileRoutes = () => {
  return routesConfig.routes;
};

export default FileRoutes;
export { routesConfig };
