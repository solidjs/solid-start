import { defineConfig } from "vite";

import { solidStart } from "../../../packages/start/src/config";
import { nitroV2Plugin } from "../../../packages/start-nitro-v2-vite-plugin/src";
import { nitro } from "nitro/vite";

export default defineConfig({
	plugins: [solidStart(), nitro()],
});
