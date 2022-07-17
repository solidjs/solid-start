/// <reference types="vitest" />

import solid from "solid-start";
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    transformMode: {
      web: [/\.[tj]sx?$/]
    },
    setupFiles: "./vitest.setup.ts",
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
  
  resolve: {
		conditions: process.env["VITEST"] ? ["browser"] : [],
	},
});
