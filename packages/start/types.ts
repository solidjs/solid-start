import type { Debugger } from "debug";
import type { Component } from "solid-js";

declare global {
  interface Window {
    DEBUG: Debugger;
    _$HY: {
      island(path: string, comp: Component): void;
      islandMap: { [path: string]: Component };
      hydrateIslands(): void;
    };
  }

  export const DEBUG: Debugger;
}

export type StartOptions = {
  adapter: string;
  appRoot: string;
  routesDir: string;
  ssr: boolean;
  islands: boolean;
  islandsRouter: boolean;
  lazy: boolean;
  prerenderRoutes: string[];
  inspect: boolean;
  pageExtensions: string[];
  root: string;
  entryClient: string;
  entryServer: string;
  appRootFile: string;
};

export {};
