import { useData } from "solid-app-router";

export { default as Links } from "./Links";
export { default as Meta } from "./Meta";
export { default as Outlet } from "./Outlet";
export { default as Scripts } from "./Scripts";
export { StartProvider } from "./StartContext";
export interface Routes {
  // '/app/blod/[id]': import('~/')
}

export function useRouterData<T extends keyof Routes>(): Routes[T] {
  return useData();
}
