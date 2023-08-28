import { A as BaseA, Location, NavigateOptions, Navigator, RouteDataFunc } from "@solidjs/router";
import { JSX } from "solid-js";
import { LocationEntry, useSearchParams as useIslandsSearchParams } from "./islands/router";
export type RouteParams<T extends string> = Record<T, string>;
export type RouteDataArgs<T extends keyof StartRoutes = "$"> = {
    data: StartRoutes[T]["data"];
    params: RouteParams<StartRoutes[T]["params"]>;
    location: Location;
    navigate: Navigator;
};
declare const A: typeof BaseA;
declare const Routes: (props: import("@solidjs/router").RoutesProps) => JSX.Element;
declare const Outlet: () => JSX.Element;
declare const useNavigate: () => Navigator;
declare const useSearchParams: typeof useIslandsSearchParams | (<T extends import("@solidjs/router").Params>() => [T, (params: import("@solidjs/router").SetParams, options?: Partial<NavigateOptions<unknown>> | undefined) => void]);
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
export declare function useRouteData<T extends keyof StartRoutes>(): ReturnType<StartRoutes[T]["data"]>;
export declare function useRouteData<T extends (...args: any[]) => any>(): T extends RouteDataFunc<infer _, infer R> ? R : ReturnType<T>;
export { useLocation } from "./islands/useLocation";
export { A, Outlet, Routes, useNavigate, useSearchParams };
