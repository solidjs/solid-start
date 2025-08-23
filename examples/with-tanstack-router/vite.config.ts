import { solidStart } from "@solidjs/start/config";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solidStart(), TanStackRouterVite({ target: "solid" })]
});
