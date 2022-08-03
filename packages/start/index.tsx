export { Link, Meta, Style, Title } from "@solidjs/meta";
export {
  Navigate,
  NavLink,
  Route,
  useHref,
  useIsRouting,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
  useResolvedPath,
  useRouteData,
  useRoutes,
  useSearchParams,
  type RouteDataFunc,
  type RouteDataFuncArgs as RouteDataArgs
} from "@solidjs/router";
export { createRouteAction, createRouteData, FormError, ServerError } from "./data";
export type { FormAction, FormMethod, FormProps, SubmitOptions } from "./data";
export { default, ErrorBoundary } from "./error-boundary";
export { island as unstable_island } from "./islands";
export { Body, FileRoutes, Head, Html, Scripts } from "./root";
export { ServerContext } from "./server/ServerContext";
export type { FetchEvent, PageEvent, ServerFunctionEvent } from "./server/types";
export {
  createCookie,
  createCookieSessionStorage,
  createMemorySessionStorage,
  createSessionStorage,
  parseCookie,
  serializeCookie,
  type CookieParseOptions,
  type CookieSerializeOptions
} from "./session";
import "./types";

import { Outlet as BaseOutlet, Routes as BaseRoutes } from "@solidjs/router";
import { Outlet as IslandsOutlet } from "./islands/server-router";

export function Routes(props) {
  if (import.meta.env.START_ISLANDS_ROUTER) {
    return (
      <IslandsOutlet>
        <BaseRoutes>{props.children}</BaseRoutes>
      </IslandsOutlet>
    );
  }
  return <BaseRoutes>{props.children}</BaseRoutes>;
}

export function Outlet(props) {
  if (import.meta.env.START_ISLANDS_ROUTER) {
    return (
      <IslandsOutlet>
        <BaseOutlet />
      </IslandsOutlet>
    );
  }

  return <BaseOutlet />;
}
