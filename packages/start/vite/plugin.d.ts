export type Options = {
  adapter: string | { start; build };
  appRoot: string;
  routesDir: string;
  ssr: boolean;
  islands: boolean;
  islandsRouter: boolean;
  prerenderRoutes: any[];
  inspect: boolean;
} & import("vite-plugin-solid").Options;
import { Plugin } from "vite";

import type { Debugger } from "debug";

declare global {
  export const DEBUG: Debugger;
}

export const start: (options?: Partial<Options>) => Plugin[];
export default start;
