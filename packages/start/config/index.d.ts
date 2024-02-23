import type { AppOptions } from "vinxi";
import type { CustomizableConfig } from "vinxi/dist/types/lib/vite-dev";
import type { Options } from "vite-plugin-solid";

type SolidStartInlineConfig = {
  /**
   * true: streaming mode
   * false: csr only
   * async: ssr is in async mode
   * sync: ssr is in sync mode
   */
  ssr?: boolean | "async" | "sync";
  solid?: Options;
  extensions?: string[];
  server?: AppOptions["server"];
  appRoot?: string;
  middleware?: string;
  islands?: boolean;
  vite?:
    | CustomizableConfig
    | ((options: { router: "server" | "client" | "server-function" }) => CustomizableConfig);
};

export declare function defineConfig(baseConfig?: SolidStartInlineConfig): any;
