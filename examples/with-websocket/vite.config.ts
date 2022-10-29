import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      ssr: false,
      durableObjects: {
        DO_WEBSOCKET: "./src/websocket.ts"
      }
      // adapter: cloudflareWorkers({
      //   durableObjects: {
      //     DO_WEBSOCKET: "WebSocketDurableObject"
      //   },
      //   kvNamespaces: ["app"]
      // })
    })
  ]
});
