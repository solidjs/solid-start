import {
  A as BaseA,
  Location,
  NavigateOptions,
  Navigator,
  Outlet as BaseOutlet,
  Routes as BaseRoutes,
  useLocation as useBaseLocation,
  useNavigate as useBaseNavigate
} from "@solidjs/router";
import { Accessor, ComponentProps, splitProps } from "solid-js";
import { Outlet as IslandsOutlet } from "./islands/server-router";

const A = import.meta.env.START_ISLANDS_ROUTER
  ? function IslandsA(props: ComponentProps<typeof BaseA>) {
      const [, rest] = splitProps(props, ["state", "activeClass", "inactiveClass", "end"]);
      const location = useLocation();
      const isActive = () => {
        return props.href.startsWith("#")
          ? location.hash === props.href
          : location.pathname === props.href;
      };

      return (
        <a
          link
          {...rest}
          state={JSON.stringify(props.state)}
          classList={{
            [props.inactiveClass || "inactive"]: !isActive(),
            [props.activeClass || "active"]: isActive(),
            ...rest.classList
          }}
          aria-current={isActive() ? "page" : undefined}
        />
      );
    }
  : BaseA;

const Routes = import.meta.env.START_ISLANDS_ROUTER
  ? function IslandsRoutes(props: ComponentProps<any>) {
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
    ? function IslandsUseLocation() {
        return {
          get pathname() {
            let location = window.LOCATION();
            return location.pathname;
          },
          get hash() {
            let location = window.LOCATION();
            return location.hash;
          }
        } as Location;
      }
    : useBaseLocation;

const useNavigate =
  import.meta.env.START_ISLANDS_ROUTER && !import.meta.env.SSR
    ? function IslandsUseNavigate() {
        return ((to: string, props?: Partial<NavigateOptions<unknown>>) => window.NAVIGATE(to, props)) as unknown as Navigator;
      }
    : useBaseNavigate;

declare global {
  interface Window {
    LOCATION: Accessor<Location>;
    NAVIGATE: Navigator;
  }
}

export { A, Outlet, Routes, useLocation, useNavigate };
