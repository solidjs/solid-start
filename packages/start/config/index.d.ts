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
  publicDir?: string;
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
  serialization?: {
    /**
     * The serialization mode to use for server functions.
     * The "js" mode uses a custom binary format that is more efficient than JSON, but requires a custom deserializer (with `eval()`) on the client.
     * A strong CSP should block `eval()` executions, which would prevent the "js" mode from working.
     * The "json" mode uses JSON for serialization, which is less efficient but can be deserialized with `JSON.parse` on the client.
     *
     * @default "js"
     * @
     * @warning on v2, "json" will be the default.
     */
    mode?: "js" | "json";
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
