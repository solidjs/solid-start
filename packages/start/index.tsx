export { Link, Meta, Style, Stylesheet, Title } from "@solidjs/meta";
export {
  Navigate,
  Route,
  useHref,
  useIsRouting,
  useMatch,
  useParams,
  useResolvedPath,
  useRouteData,
  useRoutes,
  useSearchParams,
  type RouteDataFunc,
  type RouteDataFuncArgs as RouteDataArgs
} from "@solidjs/router";
export type { APIEvent as APIEvent } from "./api";
export {
  createRouteAction,
  createRouteData,
  createRouteMultiAction,
  FormError,
  refetchRouteData,
  ServerError
} from "./data";
export type { FormAction, FormMethod, FormProps, SubmitOptions } from "./data";
export { default, ErrorBoundary, ErrorMessage } from "./error-boundary";
export { clientOnly as unstable_clientOnly, island as unstable_island } from "./islands";
export { Body, Head, Html, Scripts } from "./root";
export * from "./router";
export * from "./server/responses";
export { ServerContext, useRequest as useServerContext } from "./server/ServerContext";
export type { FetchEvent, PageEvent, ServerFunctionEvent } from "./server/types";
export {
  createCookie,
  createCookieSessionStorage,
  createMemorySessionStorage,
  createSessionStorage,
  parseCookie,
  serializeCookie,
  type CookieParseOptions,
  type CookieSerializeOptions,
  type SessionIdStorageStrategy,
  type SessionStorage
} from "./session";
import { JSX } from "solid-js";
import "./types";
export declare function FileRoutes(): JSX.Element;
