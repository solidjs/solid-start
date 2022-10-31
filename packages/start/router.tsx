import {
  A as BaseA,
  Location,
  Navigator,
  Outlet as BaseOutlet,
  Routes as BaseRoutes,
  useNavigate as useBaseNavigate,
  useSearchParams as useBaseSearchParams
} from "@solidjs/router";
import { Accessor, JSX } from "solid-js";
import IslandsA from "./islands/A";
import { useSearchParams as useIslandsSearchParams } from "./islands/router";
import { Outlet as IslandsOutlet } from "./islands/server-router";

export type RouteParams<T extends string> = Record<T, string>;

export type RouteDataArgs<T extends keyof StartRoutes = ""> = {
  data: StartRoutes[T]["data"];
  params: RouteParams<StartRoutes[T]["params"]>;
  location: Location;
  navigate: Navigator;
};

const A = import.meta.env.START_ISLANDS_ROUTER ? IslandsA : BaseA;

const Routes = /* @__PURE__ */ import.meta.env.START_ISLANDS_ROUTER
  ? /* @__PURE__ */ function IslandsRoutes(props: { children: JSX.Element }) {
      return (
        <IslandsOutlet>
          <BaseRoutes>{props.children}</BaseRoutes>
        </IslandsOutlet>
      );
    }
  : /* @__PURE__ */ BaseRoutes;

const Outlet = /* @__PURE__ */ import.meta.env.START_ISLANDS_ROUTER
  ? /* @__PURE__ */ function HybridOutlet() {
      return (
        <IslandsOutlet>
          <BaseOutlet />
        </IslandsOutlet>
      );
    }
  : /* @__PURE__ */ BaseOutlet;

const useNavigate =
  import.meta.env.START_ISLANDS_ROUTER && !import.meta.env.SSR
    ? function IslandsUseNavigate() {
        return ((to, props) => window.NAVIGATE(to, props)) as Navigator;
      }
    : useBaseNavigate;

const useSearchParams =
  /* @__PURE__ */ import.meta.env.START_ISLANDS_ROUTER && !import.meta.env.SSR
    ? useIslandsSearchParams
    : /* @__PURE__ */ useBaseSearchParams;

declare global {
  interface Window {
    LOCATION: Accessor<Location>;
    NAVIGATE: Navigator;
    ROUTER: EventTarget;
  }

  interface StartRoutes {
    "": {
      params: any;
      data: any;
    };
  }
}

export { useLocation } from "./islands/useLocation";
export { A, Outlet, Routes, useNavigate, useSearchParams };
