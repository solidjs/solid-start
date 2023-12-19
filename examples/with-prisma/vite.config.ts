import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: { external: ["@prisma/client"] }
});
