import { createRouteAction, createRouteData, createRouteMultiAction } from "../data";
export { ServerError } from "../data";
export const createServerData$ = createRouteData;
export const createServerAction$ = createRouteAction;
export const createServerMultiAction$ = createRouteMultiAction;
