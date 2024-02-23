import { defineConfig } from "@solidjs/start/config";
import { docsMdx } from "solid-start-mdx";
import tailwindcss from "tailwindcss";
import { config } from "vinxi/plugins/config";

export default defineConfig({
  appRoot: "./docs",
  extensions: ["mdx", "md"],
  islands: true,
  server: {
    preset: "cloudflare_module",
    rollupConfig: {
      external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"]
    },
    prerender: {
      crawlLinks: true
    }
  },
  vite: {
    optimizeDeps: {
      entries: []
    },
    plugins: [
      config("tailwind", {
        css: {
          postcss: {
            plugins: [tailwindcss]
          }
        }
      } as any),
      docsMdx()
    ]
  }
});
