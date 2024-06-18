import type { AppOptions, createApp } from "vinxi";
import type { CustomizableConfig } from "vinxi/dist/types/lib/vite-dev";
import { InlineConfig } from "vite";
import type { Options } from "vite-plugin-solid";

// should probably be maintained by Vinxi
type VinxiViteServerOptions = Omit<
  InlineConfig["server"],
  "port" | "strictPort" | "host" | "middlewareMode" | "open"
>;

type ViteCustomizableConfig = CustomizableConfig & {
  server?: VinxiViteServerOptions;
};

type SolidStartInlineConfig = {
  ssr?: boolean;
  solid?: Options;
  extensions?: string[];
  server?: AppOptions["server"];
  appRoot?: string;
  routeDir?: string;
  middleware?: string;
  devOverlay?: boolean;
  experimental?: {
    islands?: boolean;
  };
  vite?:
    | ViteCustomizableConfig
    | ((options: { router: "server" | "client" | "server-function" }) => ViteCustomizableConfig);
};

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/entrypoints/app-config
 */
export declare function defineConfig(
  baseConfig?: SolidStartInlineConfig
): ReturnType<typeof createApp>;
