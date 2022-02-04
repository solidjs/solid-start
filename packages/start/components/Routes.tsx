/// <reference path="../types.d.ts" />

import { useRoutes } from "solid-app-router";
// @ts-expect-error
const routes = $ROUTES;
// console.log(routes);
export default useRoutes(routes);
