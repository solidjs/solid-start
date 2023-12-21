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
    }
}

export declare function defineConfig(baseConfig?: SolidStartInlineConfig)