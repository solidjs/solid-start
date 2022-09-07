export { Link, Meta, Style, Title } from "@solidjs/meta";
export {
  Link as RouterLink,
  Navigate,
  NavLink,
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
import type { Accessor } from "solid-js";
import "./types";

import {
  Location, Navigator, Outlet as BaseOutlet,
  Routes as BaseRoutes,
  useLocation as useBaseLocation,
  useNavigate as useBaseNavigate
} from "@solidjs/router";
import { isServer } from "solid-js/web";
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

declare global {
  interface Window {
    LOCATION: Accessor<Location>;
    NAVIGATE: Navigator;
  }
}

export function useLocation() {
  if (import.meta.env.START_ISLANDS_ROUTER && !isServer) {
    return {
      get pathname() {
        let location = window.LOCATION();
        return location.pathname;
      }
    };
  } else {
    return /*#__PURE__*/ useBaseLocation();
  }
}

export function useNavigate() {
  if (import.meta.env.START_ISLANDS_ROUTER && !isServer) {
    return ((to, props) => window.NAVIGATE(to, props)) as unknown as Navigator;
  } else {
    return /*#__PURE__*/ useBaseNavigate();
  }
}
