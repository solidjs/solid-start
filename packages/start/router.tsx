import {
  A as BaseA,
  Location,
  Navigator,
  Outlet as BaseOutlet,
  Routes as BaseRoutes,
  useLocation as useBaseLocation,
  useNavigate as useBaseNavigate,
  useSearchParams as useBaseSearchParams
} from "@solidjs/router";
import { Accessor, JSX } from "solid-js";
import IslandsA from "./islands/A";
import {
  useLocation as useIslandsLocation,
  useSearchParams as useIslandsSearchParams
} from "./islands/router";
import { Outlet as IslandsOutlet } from "./islands/server-router";

export type RouteParams<T extends string> = Record<T, string>;

export type RouteDataArgs<T extends keyof StartRoutes = ""> = {
  data: StartRoutes[T]["data"];
  params: RouteParams<StartRoutes[T]["params"]>;
  location: Location;
  navigate: Navigator;
};

const A = import.meta.env.START_ISLANDS_ROUTER ? IslandsA : BaseA;

const Routes = import.meta.env.START_ISLANDS_ROUTER
  ? function IslandsRoutes(props: { children: JSX.Element }) {
      return (
        <IslandsOutlet>
          <BaseRoutes>{props.children}</BaseRoutes>
        </IslandsOutlet>
      );
    }
  : BaseRoutes;

const Outlet = import.meta.env.START_ISLANDS_ROUTER
  ? function HybridOutlet() {
      return (
        <IslandsOutlet>
          <BaseOutlet />
        </IslandsOutlet>
      );
    }
  : BaseOutlet;

const useLocation =
  import.meta.env.START_ISLANDS_ROUTER && !import.meta.env.SSR
    ? useIslandsLocation
    : useBaseLocation;

const useNavigate =
  import.meta.env.START_ISLANDS_ROUTER && !import.meta.env.SSR
    ? function IslandsUseNavigate() {
        return ((to, props) => window.NAVIGATE(to, props)) as Navigator;
      }
    : useBaseNavigate;

const useSearchParams =
  import.meta.env.START_ISLANDS_ROUTER && !import.meta.env.SSR
    ? useIslandsSearchParams
    : useBaseSearchParams;

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

export { A, Outlet, Routes, useLocation, useNavigate, useSearchParams };
