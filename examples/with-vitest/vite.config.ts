/// <reference types="vitest" />
/// <reference types="vite/client" />

import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    transformMode: {
      web: [/\.[tj]sx?$/]
    },
    setupFiles: "./scripts/setup-vitest.ts",
    // solid needs to be inline to work around
    // a resolution issue in vitest:
    deps: {
      inline: [/solid-js/]
    }
    // if you have few tests, try commenting one
    // or both out to improve performance:
    // threads: false,
    // isolate: false,
  },
  plugins: [solid()],
  build: {
    target: "esnext",
    polyfillDynamicImport: false
  },
  resolve: {
    conditions: ["development", "browser"]
  }
});
