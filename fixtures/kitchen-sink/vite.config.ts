import { defineConfig } from "vite";
import solid from "solid-start";

export default defineConfig({
  test: {
    exclude: ["./e2e/**/*.spec.js", "node_modules"],

    // globals: true,
    environment: "jsdom",
    transformMode:
      process.env.TEST_ENV === "server"
        ? {
            ssr: [/.[tj]sx?$/]
          }
        : {
            web: [/.[tj]sx?$/]
          },
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
  build: {
    target: "esnext",
    polyfillDynamicImport: false
  },
  resolve: {
    conditions: process.env.TEST_ENV === "server" ? [] : ["development", "browser"]
  },
  plugins: [solid()]
});
