export type Options = {
  adapter: string | { start; build };
  appRoot: string;
  routesDir: string;
  ssr: boolean;
  islands: boolean;
  islandsRouter: boolean;
  prerenderRoutes: any[];
  inspect: boolean;
  rootEntry: string;
  serverEntry: string;
  clientEntry: string;
} & import("vite-plugin-solid").Options;
import { Plugin } from "node_modules/vite";

import type { Debugger } from "debug";
import type { Component } from "solid-js";

declare global {
  interface Window {
    DEBUG: Debugger;
    _$HY: {
      island(path: string, comp: Component): void;
      islandMap: { [path: string]: Component };
      hydrateIslands(): void;
      fe(id: string): void;
    };
  }

  export const DEBUG: Debugger;
}

export const start: (options?: Partial<Options>) => Plugin[];
export default start;
