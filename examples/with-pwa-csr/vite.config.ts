import solid from "solid-start/vite";
import { defineConfig } from "vite";

import { VitePWA } from "vite-plugin-pwa";

// These packages are needed to determine
// the revision of the rendered index.html file.
import crypto from "crypto";
import path from "path";
import fs from "fs";

const indexHtmlRevision = () => {
  const index_path = path.resolve(__dirname, ".solid/index.html");
  const file_buffer = fs.readFileSync(index_path);
  const hash = crypto.createHash("md5");
  hash.update(file_buffer);
  return hash.digest("hex");
};

export default defineConfig({
  plugins: [
    solid({
      // We turn off SSR to enable CSR.
      ssr: false
    }),

    VitePWA({
      base: "/",
      includeAssets: ["favicon.ico"],

      // We use a component to ask the user to confirm the reload.
      registerType: "prompt",
      
      workbox: {
        // Environment variable set only when building the client.
        // See <https://github.com/solidjs/solid-start/blob/df5d22be3db0f76e4ab5d815c1892855ec43b1f2/packages/start/bin.cjs#L398>.
        additionalManifestEntries: process.env.START_SPA_CLIENT ? [
          // Manually add the index.html entry since
          // this file is rendered when building.
          {
            url: "index.html",
            revision: indexHtmlRevision()
          }
        ] : undefined
      }, 
      
      devOptions: {
        enabled: true
      },

      manifest: {
        name: "SolidStart",
        short_name: "SolidStart",
        description: "A minimal PWA to show how to use vite-plugin-pwa in SolidStart with CSR and no 'index.html' file.",

        icons: [
          {
            src: "/img/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/img/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ],

        start_url: "/",
        background_color: "#f2f3f5",
        display: "standalone",
        theme_color: "#2c4f7c"
      }
    })
  ]
});
