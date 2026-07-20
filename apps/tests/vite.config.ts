import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { solidStart } from "../../packages/start/src/config";
import { imagePlugin } from '../../packages/image/src/vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    solidStart({
      env: {
        server: {
          load() {
            return {
              SERVER_EXAMPLE: "This is a server example.",
            };
          },
        },
        client: {
          load() {
            return {
              CLIENT_EXAMPLE: "This is a client example.",
            };
          },
        },
      },
    }),
    nitro({
      compressPublicAssets: true,
    }),
    imagePlugin({
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
    }),
  ],
});
