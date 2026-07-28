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
  var USING_SOLID_START_DEV_SERVER: boolean | undefined;
  /**
   * Called with whatever a server function threw, before it is serialized into
   * the response. Return a replacement value to send that instead, or
   * `undefined` to leave the original untouched.
   */
  var __transformServerFnError: ((thrown: unknown) => unknown) | undefined;
}
