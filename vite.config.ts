import { defineConfig } from "@solidjs/start/config";
import { docsMdx } from "solid-start-mdx";
import tailwindcss from "tailwindcss";
import { config } from "vinxi/plugins/config";

export default defineConfig({
  optimizeDeps: {
    entries: []
  },
  start: {
    appRoot: "./docs",
    extensions: ["mdx", "md"],
    server: {
      preset: "cloudflare",
      rollupConfig: {
        external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"]
      },
      prerender: {
        crawlLinks: true
      }
    }
  },
  plugins: [
    config("tailwind", {
      css: {
        postcss: {
          plugins: [tailwindcss]
        }
      }
    }),
    docsMdx()
  ]
});
