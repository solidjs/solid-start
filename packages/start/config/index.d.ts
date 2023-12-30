import { AppOptions } from "vinxi";
import { InlineConfig } from "vite";

type SolidStartInlineConfig = Omit<InlineConfig, "router"> & {
    start?: {
        ssr?: boolean | "async",
        extensions?: string[],
        server?: AppOptions['server'],
        appRoot?: string,
        middleware?: string,
        islands?: boolean
    },
    plugins?: Plugins | {
        client?: Plugins,
        server?: Plugins,
        serverFunctions?: Plugins
    }
}

type Plugins = InlineConfig["plugins"] | (() => Promise<InlineConfig["plugins"]> | InlineConfig["plugins"])

export declare function defineConfig(baseConfig?: SolidStartInlineConfig)