import {
  A as BaseA,
  Location,
  Navigator,
  Outlet as BaseOutlet,
  Routes as BaseRoutes,
  useLocation as useBaseLocation,
  useNavigate as useBaseNavigate
} from "@solidjs/router";
import { Accessor } from "solid-js";
import { island as unstable_island } from "./islands";
import { useLocation as useIslandsLocation } from "./islands/router";
import { Outlet as IslandsOutlet } from "./islands/server-router";

const IslandsA = unstable_island(() => import("./islands/A"));
const A = import.meta.env.START_ISLANDS_ROUTER ? IslandsA : BaseA;

const Routes = import.meta.env.START_ISLANDS_ROUTER
  ? function IslandsRoutes(props) {
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
        return ((to, props) => window.NAVIGATE(to, props)) as unknown as Navigator;
      }
    : useBaseNavigate;

declare global {
  interface Window {
    LOCATION: Accessor<Location>;
    NAVIGATE: Navigator;
    ROUTER: EventTarget;
  }
}

export { A, Outlet, Routes, useLocation, useNavigate };
