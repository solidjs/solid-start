import { defineConfig } from "vite";
import { nitroV2Plugin } from "../../packages/start-nitro-v2-vite-plugin/src";
import { solidStart } from "../../packages/start/src/config";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    solidStart({
      image: {
        local: {
          sizes: [480, 600],
          quality: 80,
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
      },
    }),
    nitroV2Plugin(),
  ],
});
