import { defineConfig } from "@solidjs/start/config";
import path from "path";

export default defineConfig({
  vite: {
    ssr: { external: ["drizzle-orm"] },
  },
});
