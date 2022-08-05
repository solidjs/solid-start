import cloudflareWorkers from "solid-start-cloudflare-workers";
import solid from "solid-start/vite";
import { defineConfig } from "vite";
import { miniflare } from "./miniflare";

export default defineConfig({
  plugins: [
    solid({
      adapter: cloudflareWorkers({
        durableObjects: {
          DO_WEBSOCKET: "WebSocketDurableObject"
        },
        kv: {
          app: {
            id: "",
            previewId: ""
          }
        }
      })
    }),
    miniflare()
  ]
});
