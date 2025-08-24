import "h3";
declare module "h3" {
  import { ViteDevServer } from "vite";

  export interface H3EventContext {
    viteDevServer?: ViteDevServer;
  }
}

import type { Rollup } from "vite";
declare global {
  var START_CLIENT_BUNDLE: Rollup.OutputBundle;
}
