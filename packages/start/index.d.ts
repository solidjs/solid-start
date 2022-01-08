import { Plugin } from "vite";
import { Options } from "vite-plugin-solid";

declare const startPlugin: (options?: Partial<Options>) => Plugin;

export default startPlugin;
