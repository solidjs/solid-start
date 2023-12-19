import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  start: {
    middleware: "./src/middleware.ts"
  }
});
