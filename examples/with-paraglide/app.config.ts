import { defineConfig } from "@solidjs/start/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
export default defineConfig({
  vite: {
    plugins: [
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
      }),
    ],
  }
});
