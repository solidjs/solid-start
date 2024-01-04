import { AppOptions } from "vinxi";
import { InlineConfig } from "vite";

type SolidStartInlineConfig = Omit<InlineConfig, "router"> & {
    start?: {
        /**
         * true: streaming mode
         * false: csr only
         * async: ssr is in async mode
         */
        ssr?: boolean | "async",
        extensions?: string[],
        server?: AppOptions['server'],
        appRoot?: string,
        middleware?: string,
        islands?: boolean
    }
}

export declare function defineConfig(baseConfig?: SolidStartInlineConfig)