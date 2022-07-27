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

export {};
