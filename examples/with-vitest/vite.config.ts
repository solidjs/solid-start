/// <reference types="vitest" />

import solid from "solid-start/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom"
  },
  plugins: [solid()]
});
