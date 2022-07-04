import { defineConfig } from "vite";
import solid from "solid-start";
import cloudflareWorkers from "solid-start-cloudflare-workers";

export default defineConfig({
  plugins: [
    solid({
      adapter: cloudflareWorkers({
        durableObjects: ["WebSocketDurableObject"]
      })
    })
  ]
});
