import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "tailwindcss";
import { config } from "vinxi/plugins/config";

export default defineConfig({
  appRoot: "./docs",
  // experimental: { islands: true },
  server: {
    preset: "cloudflare_module",
    alias: {
      "_mime": "mime/index.js"
    },
    rollupConfig: {
      external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"]
    }
  },
  vite: {
    plugins: [
      config("tailwind", {
        css: {
          postcss: {
            plugins: [tailwindcss]
          }
        }
      } as any)
    ]
  }
});
