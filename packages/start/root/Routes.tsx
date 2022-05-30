/// <reference path="../server/types.tsx" />

import { useRoutes } from "solid-app-router";
// @ts-expect-error
var routes = $ROUTES;
/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */
const Routes = useRoutes(routes);
export default Routes;
