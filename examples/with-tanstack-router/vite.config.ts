import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import { solidStart } from "../../packages/start/src/config";

export default defineConfig({
  plugins: [solidStart(), TanStackRouterVite({ target: "solid" })]
});
