import { defineConfig } from "vite";
import { solidStart } from "../../packages/start/src/config";
import { nitroV2Plugin } from "../../packages/start-nitro-v2-plugin/src";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [solidStart(), nitroV2Plugin()],
});
