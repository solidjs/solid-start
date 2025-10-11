import { solidStart } from "../../../packages/start/src/config";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solidStart({
      middleware: "./src/middleware.ts"
    })
  ]
});
