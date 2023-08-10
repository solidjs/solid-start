import type { Debugger } from "debug";
import type { Component } from "solid-js";

declare global {
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

  interface RequestInit {
    duplex?: "half";
  }
}

export type Adapter = {
  start(): void;
  build(): void;
  dev?(): void;
};

export type StartOptions = {
  adapter: string | Adapter;
  appRoot: string;
  routesDir: string;
  ssr: boolean;
  islands: boolean;
  islandsRouter: boolean;
  lazy: boolean;
  prerenderRoutes: string[];
  inspect: boolean;
  root: string;
  clientEntry: string;
  serverEntry: string;
  appRootFile: string;
};
