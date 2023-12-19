import { InlineConfig } from "vite";

type SolidStartInlineConfig = Omit<InlineConfig, "router"> & {
    start?: {
        ssr?: boolean,
        extensions?: string[],
        server?: any,
        appRoot?: string,
        middleware?: string
        islands?: boolean
    }
}

export declare function defineConfig(baseConfig: SolidStartInlineConfig)