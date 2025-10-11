import { solidStart } from "@solidjs/start/config";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [solidStart()],
});
