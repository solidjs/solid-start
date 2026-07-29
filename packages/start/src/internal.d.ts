import "h3";
declare module "h3" {
  import { ViteDevServer } from "vite";

  export interface H3EventContext {
    viteDevServer?: ViteDevServer;
  }
}

declare global {
  var USING_SOLID_START_DEV_SERVER: boolean | undefined;
}
