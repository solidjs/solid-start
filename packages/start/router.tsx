import {
  Location,
  Navigator,
  Outlet as BaseOutlet,
  Routes as BaseRoutes,
  useLocation as useBaseLocation,
  useNavigate as useBaseNavigate
} from "@solidjs/router";
import { Accessor } from "solid-js";
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
