import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite";
import { imagePlugin } from "@solidjs/image/vite";
import { solidStart } from "../../../packages/start/src/config/index.js";
import { nitroV2Plugin } from "../../../packages/start-nitro-v2-vite-plugin/src";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    imagePlugin({
      local: {
        sizes: [480, 600],
        quality: 80,
        output: ["avif"],
        publicPath: "public",
      },
      remote: {
        transformURL(url) {
          return {
            src: {
              source: `https://picsum.photos/seed/${url}/1200/900.webp`,
              width: 1080,
              height: 760,
            },
            variants: [
              {
                path: `https://picsum.photos/seed/${url}/800/600.jpg`,
                width: 800,
                type: "image/jpeg",
              },
              {
                path: `https://picsum.photos/seed/${url}/400/300.jpg`,
                width: 400,
                type: "image/jpeg",
              },
              {
                path: `https://picsum.photos/seed/${url}/800/600.png`,
                width: 800,
                type: "image/png",
              },
              {
                path: `https://picsum.photos/seed/${url}/400/300.png`,
                width: 400,
                type: "image/png",
              },
            ],
          };
        },
      },
    }),
    solidStart(),
    nitroV2Plugin(),
  ],
  // resolve: {
  //     alias: {
  //       "@solidjs/image": path.resolve(__dirname, "../../../packages/image/dist/index.js"),
  //     }
  // }
});
