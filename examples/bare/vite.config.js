import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  start: {
    ssr: true,
    middleware: "./src/middleware.ts"
  }
});
