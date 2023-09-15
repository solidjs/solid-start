import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  start: {
    islands: true,
    middleware: "./src/middleware.ts"
  }
});
