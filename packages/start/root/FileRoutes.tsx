/// <reference path="../server/types.tsx" />

// @ts-expect-error
var routes = $ROUTES;

/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */

const FileRoutes = () => {
  return routes;
};

export default FileRoutes;
export { routes as fileRoutes };
