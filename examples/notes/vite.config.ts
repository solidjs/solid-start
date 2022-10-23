import startCloudflareWorkers from "solid-start-cloudflare-workers";
import solid from "solid-start/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    solid({
      islands: true,
      islandsRouter: true,
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
