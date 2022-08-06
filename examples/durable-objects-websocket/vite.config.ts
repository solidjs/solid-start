import cloudflareWorkers from "solid-start-cloudflare-workers";
import solid from "solid-start/vite";
import windicss from "vite-plugin-windicss";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      adapter: cloudflareWorkers({
        durableObjects: ["WebSocketDurableObject"]
      })
    }),
    windicss()
  ]
});
