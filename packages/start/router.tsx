import {
  A as BaseA,
  Location,
  NavigateOptions,
  Navigator,
  Outlet as BaseOutlet,
  RouteDataFunc,
  Routes as BaseRoutes,
  useNavigate as useBaseNavigate,
  useRouteData as useBaseRouteData,
  useSearchParams as useBaseSearchParams
} from "@solidjs/router";
import { JSX } from "solid-js";
import IslandsA from "./islands/A";
import { LocationEntry, useSearchParams as useIslandsSearchParams } from "./islands/router";
import { Outlet as IslandsOutlet } from "./islands/server-router";

export type RouteParams<T extends string> = Record<T, string>;

export type RouteDataArgs<T extends keyof StartRoutes = "$"> = {
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
    ? (function IslandsUseNavigate() {
        return (to, props: Partial<NavigateOptions> = {}) =>
          window.router.navigate(to as string, props);
      } as typeof useBaseNavigate)
    : useBaseNavigate;

const useSearchParams =
  /* @__PURE__ */ import.meta.env.START_ISLANDS_ROUTER && !import.meta.env.SSR
    ? useIslandsSearchParams
    : /* @__PURE__ */ useBaseSearchParams;

declare global {
  interface Window {
    router: {
      navigate: (to: string, options?: Partial<NavigateOptions>) => Promise<boolean>;
      push: (to: string | URL, options: Partial<NavigateOptions>) => void;
      update: (body: string) => Promise<boolean>;
      router: EventTarget;
      location: () => LocationEntry;
    };
  }

  interface StartRoutes {
    $: {
      params: any;
      data: any;
    };
  }

  interface Route {
    "/notes/[note]": "/notes/[note]";
  }
}

export function useRouteData<T extends keyof StartRoutes>(): ReturnType<StartRoutes[T]["data"]>;
export function useRouteData<T extends (...args: any[]) => any>(): T extends RouteDataFunc<infer _, infer R> ? R : ReturnType<T>;
export function useRouteData<T extends keyof StartRoutes>(): ReturnType<StartRoutes[T]["data"]> {
  // @ts-ignore
  return useBaseRouteData<T>();
}

export { useLocation } from "./islands/useLocation";
export { A, Outlet, Routes, useNavigate, useSearchParams };

