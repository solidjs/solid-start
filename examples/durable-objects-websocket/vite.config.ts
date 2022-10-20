import cloudflareWorkers from "solid-start-cloudflare-workers";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      ssr: false,
      adapter: cloudflareWorkers({
        durableObjects: {
          DO_WEBSOCKET: "WebSocketDurableObject"
        },
        kvNamespaces: ["app"]
      })
    })
  ]
});
