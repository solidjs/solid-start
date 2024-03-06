import type { AppOptions } from "vinxi";
import type { CustomizableConfig } from "vinxi/dist/types/lib/vite-dev";
import type { Options } from "vite-plugin-solid";

type SolidStartInlineConfig = {
  ssr?: boolean;
  solid?: Options;
  extensions?: string[];
  server?: AppOptions["server"];
  appRoot?: string;
  routeDir?: string;
  middleware?: string;
  devOverlay?:  boolean;
  experimental?: {
    islands?: boolean;
  }
  vite?:
    | CustomizableConfig
    | ((options: { environment: "server" | "client" | "server-function" }) => CustomizableConfig);
};

export declare function defineConfig(baseConfig?: SolidStartInlineConfig): any;
