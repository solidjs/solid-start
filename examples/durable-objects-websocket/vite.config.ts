import { defineConfig } from "vite";
import solid from "solid-start";
import worker from "solid-start-cloudflare-workers";

export default defineConfig({
  plugins: [
    solid({
      adapter: worker({
        reexport: ["WebSocketDurableObject"]
      })
    })
  ]
});
