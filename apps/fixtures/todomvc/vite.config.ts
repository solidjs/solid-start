import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import { solidStart } from "../../../packages/start/src/config";

export default defineConfig({
  plugins: [solidStart(), nitro({ preset: "node-server" })],
});
