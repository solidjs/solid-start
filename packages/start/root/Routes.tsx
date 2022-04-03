/// <reference path="../types.ts" />

import { useRoutes } from "solid-app-router";
// @ts-expect-error
const routes = $ROUTES;
// console.log(routes);
/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */
const Routes = useRoutes(routes);
export default Routes;
