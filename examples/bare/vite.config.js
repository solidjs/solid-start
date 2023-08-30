import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  start: {
    ssr: false,
    islands: false,
    serverPlugins: ["./middleware.ts"]
  }
});
