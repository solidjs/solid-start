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
      durableObjects: {
        db: "./src/db.ts"
      },
      adapter: startCloudflareWorkers({
        durableObjectsPersist: true,
        kvPersist: false,
        async init(mf) {}
      })
    })
  ]
});
