import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "tailwindcss";
import { config } from "vinxi/plugins/config";

export default defineConfig({
  // experimental: { islands: true },
  server: {
    preset: "cloudflare_module",
    alias: {
      "_mime": "mime/index.js"
    },
  },
  vite: {
    build: {
      rollupOptions: {
        external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"]
      },
    },
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
