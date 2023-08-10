export { Link, Meta, Style, Stylesheet, Title } from "@solidjs/meta";
export {
  Navigate,
  Route,
  useHref,
  useIsRouting,
  useMatch,
  useParams,
  useResolvedPath,
  useRoutes,
  useSearchParams,
  type RouteDataFunc,
  type RouteDataFuncArgs
} from "@solidjs/router";
export type { APIEvent } from "./api";
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
export { clientOnly as unstable_clientOnly } from "./islands";
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
export * from "./types";

import { JSX } from "solid-js";

export declare function FileRoutes(): JSX.Element;
