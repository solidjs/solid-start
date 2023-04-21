import node from "@astrojs/node";
import { defineConfig } from "astro/config";
import start from "solid-start/astro";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone"
  }),
  integrations: [start(), tailwind()]
});
