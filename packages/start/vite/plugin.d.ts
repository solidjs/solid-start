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

export const start: (options?: Partial<Options>) => Plugin[];
export default start;
