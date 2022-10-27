import startCloudflareWorkers from "solid-start-cloudflare-workers";
import solid from "solid-start/vite";
import icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    icons({
      compiler: "solid"
    }),
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
