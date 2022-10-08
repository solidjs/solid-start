import {
  A as BaseA,
  Location,
  Navigator,
  Outlet as BaseOutlet,
  Routes as BaseRoutes,
  useLocation as useBaseLocation,
  useNavigate as useBaseNavigate
} from "@solidjs/router";
import { Accessor, splitProps } from "solid-js";
import { isServer } from "solid-js/web";
import { Outlet as IslandsOutlet } from "./islands/server-router";

const A = import.meta.env.START_ISLANDS_ROUTER
  ? function IslandsA(props) {
      const [, rest] = splitProps(props, ["state", "activeClass", "inactiveClass", "end"]);
      const location = useLocation();
      const isActive = () => location.pathname === props.href;

      return (
        <a
          link
          {...rest}
          state={JSON.stringify(props.state)}
          classList={{
            [props.inactiveClass || "active"]: !isActive(),
            [props.activeClass || "inactive"]: isActive(),
            ...rest.classList
          }}
          aria-current={isActive() ? "page" : undefined}
        />
      );
    }
  : BaseA;

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

const useLocation = import.meta.env.START_ISLANDS_ROUTER && !isServer
  ? function IslandsUseLocation() {
      return {
        get pathname() {
          let location = window.LOCATION();
          return location.pathname;
        }
      } as Location;
    }
  : useBaseLocation;

const useNavigate = import.meta.env.START_ISLANDS_ROUTER && !isServer
  ? function IslandsUseNavigate() {
      return ((to, props) => window.NAVIGATE(to, props)) as unknown as Navigator;
    }
  : useBaseNavigate;

declare global {
  interface Window {
    LOCATION: Accessor<Location>;
    NAVIGATE: Navigator;
  }
}

export { A, Outlet, Routes, useLocation, useNavigate };
