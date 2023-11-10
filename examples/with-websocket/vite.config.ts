import startCloudflareWorkers from "solid-start-cloudflare-workers";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      ssr: true,
      experimental: {
        websocket: true
      },
      adapter: startCloudflareWorkers({
        durableObjectsPersist: true,
        kvPersist: false,
      })
    })
  ]
});
