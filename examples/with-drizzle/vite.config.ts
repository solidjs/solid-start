import { solidStart } from "@solidjs/start/config";
import { nitroV2Plugin } from "@solidjs/start/nitro-v2-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solidStart(), nitroV2Plugin()],
  ssr: { external: ["drizzle-orm"] }
});
