import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  start: {
    ssr: true,
    islands: false,
    serverPlugins: ["./src/middleware.ts"]
  }
});
