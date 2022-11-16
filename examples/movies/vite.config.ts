import solid from "solid-start/vite";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    icons({
      compiler: "solid",
      customCollections: {
        icons: FileSystemIconLoader("./src/assets/images")
      }
    }),
    solid({
      islands: true,
      islandsRouter: true
    })
  ]
});
