/// <reference types="vitest" />

import solid from "solid-start";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	// Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
	const env = loadEnv(mode, process.cwd(), '');

  return {
    test: {
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
      conditions: env["VITEST"] ? ["browser"] : [],
    },
  }
});
