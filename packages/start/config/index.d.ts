import { InlineConfig } from "vite";

type SolidStartInlineConfig = Omit<InlineConfig, "router"> & {
    start?: {
        ssr?: boolean | "async",
        extensions?: string[],
        server?: any,
        appRoot?: string,
        middleware?: string,
        //islands?: boolean TODO: Get PROD bugs working probably missing release
    }
}

export declare function defineConfig(baseConfig: SolidStartInlineConfig)