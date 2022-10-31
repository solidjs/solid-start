export type Adapter = {
  start(options: Options): Promise<void>;
  build(options: Options): Promise<void>;
  dev(config: UserConfig & { solidOptions: Options }, viteDevServer: ViteDevServer): Promise<void>;
  name: string;
};

export type Options = {
  adapter: string | Adapter;
  appRoot: string;
  routesDir: string;
  ssr: boolean;
  prerenderRoutes: any[];
  experimental: {
    islands?: boolean;
    islandsRouter?: boolean;
    websocket?: boolean;
  };
  inspect: boolean;
  rootEntry: string;
  serverEntry: string;
  clientEntry: string;
  router: import("../fs-router/router").Router;
} & import("vite-plugin-solid").Options;

import type { Debugger } from "debug";
import type { Component } from "solid-js";
import { Plugin, ResolvedConfig, UserConfig, ViteDevServer } from "vite";

export type ViteConfig = ResolvedConfig & { solidOptions: Options; adapter: Adapter };

declare global {
  export const DEBUG: Debugger;
  interface Window {
    DEBUG: Debugger;
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
