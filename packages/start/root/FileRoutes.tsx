/// <reference path="../server/types.tsx" />

// @ts-expect-error
var routeData = $ROUTE_DATA;

export const fileRoutes = routeData.routes;
export const routeLayouts = routeData.routeLayouts;

/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */

const FileRoutes = () => {
  return fileRoutes;
};

export default FileRoutes;
