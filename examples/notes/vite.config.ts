import startCloudflareWorkers from "solid-start-cloudflare-workers";
import solid from "solid-start/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    solid({
      islands: true,
      islandsRouter: true,
      hot: false,
      adapter: startCloudflareWorkers({
        durableObjectsPersist: true,
        kvPersist: false,
        durableObjects: {
          DO: "NotesDB"
        },
        async init(mf) {}
      })
    })
  ]
});
