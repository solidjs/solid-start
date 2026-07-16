import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { solidStart } from "../../../packages/start/src/config";

export default defineConfig({
  plugins: [solidStart({ middleware: "./src/middleware.ts" }), nitro({ preset: "node-server" })],
});
