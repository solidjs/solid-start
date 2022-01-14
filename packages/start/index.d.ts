import { Plugin } from "vite";
import { Options } from "vite-plugin-solid";

declare const startPlugin: (options?: Partial<Options> & { adapter: any }) => Plugin;

export default startPlugin;
