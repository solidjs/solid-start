import { defineConfig } from "vite";
import { solidStart } from "../../packages/start/src/config";

export default defineConfig({
  plugins: [solidStart({ ssr: true })]
});
