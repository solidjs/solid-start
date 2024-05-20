import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "tailwindcss";
import { config } from "vinxi/plugins/config";

export default defineConfig({
  appRoot: "./docs",
  extensions: ["mdx", "md"],
  experimental: { islands: true },
  server: {
    preset: "cloudflare_module",
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
