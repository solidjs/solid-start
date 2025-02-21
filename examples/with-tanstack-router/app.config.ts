import { defineConfig } from "@solidjs/start/config";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  ssr: false,
  vite: {
    plugins: [TanStackRouterVite({ target: "solid" })]
  }
});
