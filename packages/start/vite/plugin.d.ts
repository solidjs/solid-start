export type Adapter = {
  start(options: Options): Promise<void>;
  build(options: Options): Promise<void>;
  dev(options: Options): Promise<void>;
  name: string;
};

export type Options = {
  adapter: string | Adapter;
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
import { Plugin } from "vite";

import type { Debugger } from "debug";
import type { Component } from "solid-js";

declare global {
  export const _$DEBUG: Debugger;
  interface Window {
    _$DEBUG: Debugger;
    _$HY: {
      island(path: string, comp: Component): void;
      islandMap: { [path: string]: Component };
      hydrateIslands(): void;
      fe(id: string): void;
    };
  }
}

export const start: (options?: Partial<Options>) => Plugin[];
export default start;
