export type Options = {
  adapter: string;
  appRoot: string;
  routesDir: string;
  ssr: boolean;
  prerenderRoutes: any[];
  inspect: boolean;
} & import("vite-plugin-solid").Options;
import { Plugin } from "vite";

export const start: (options?: Partial<Options>) => Plugin[];
export default start;
