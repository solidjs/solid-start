export type Adapter = {
  start(options: Options): Promise<void>;
  build(options: Options): Promise<void>;
  dev(config: UserConfig & { solidOptions: Options }, viteDevServer: ViteDevServer): Promise<void>;
  name: string;
};

export type Options = Omit<import("vite-plugin-solid").Options, "ssr"> & {
  adapter: string | Adapter;
  appRoot: string;
  routesDir: string;
  ssr: boolean | "async" | "sync" | "streaming";
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
};

import type { Debugger } from "debug";
import type { Component } from "solid-js";
import { Plugin, ResolvedConfig, UserConfig, ViteDevServer } from "vite";

export type ViteConfig = ResolvedConfig & { solidOptions: Options; adapter: Adapter };

declare global {
  export const _$DEBUG: Debugger;
  interface Window {
    _$DEBUG: Debugger;
    _$HY: {
      island(path: string, comp: Component): void;
      islandMap: { [path: string]: Component };
      hydrateIslands(): void;
      fe(id: string): void;
      morph(prev: HTMLElement, next: HTMLElement): Promise<boolean>;
    };
  }
}

export function createAdapter(adapter: Adapter): Adapter;

export const start: (options?: Partial<Options>) => Plugin[];
export default start;
