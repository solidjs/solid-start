import { AppOptions } from "vinxi";
import { InlineConfig } from "vite";
import type { Options } from "vite-plugin-solid";


type SolidStartInlineConfig = Omit<InlineConfig, "router" | "plugins"> & {
    plugins?: InlineConfig['plugins'] | (() => InlineConfig['plugins']),
    start?: {
        /**
         * true: streaming mode
         * false: csr only
         * async: ssr is in async mode
         * sync: ssr is in sync mode
         */
        ssr?: boolean | "async" | "sync",
        solid?: Options,
        extensions?: string[],
        server?: AppOptions['server'],
        appRoot?: string,
        middleware?: string,
        islands?: boolean
    }
}

export declare function defineConfig(baseConfig?: SolidStartInlineConfig)
