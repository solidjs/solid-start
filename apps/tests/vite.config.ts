import { solidStart } from "@solidjs/start/config";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000
  },
  optimizeDeps: {
    exclude: ["lightningcss", "fsevents"]
  },
  plugins: [solidStart()]
});
