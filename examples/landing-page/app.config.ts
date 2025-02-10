import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  // experimental: { islands: true },
  server: {
    preset: "netlify"
  }
});
