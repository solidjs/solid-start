import { solidStart } from "@solidjs/start/config";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solidStart()],
  ssr: { external: ["drizzle-orm"] }
});
