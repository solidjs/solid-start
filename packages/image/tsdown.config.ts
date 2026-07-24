import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: "src/core/index.tsx",
    format: ["esm"],
    dts: true,
    tsconfig: "tsconfig.build.json",
    clean: true,
    platform: "browser",
    outExtensions: () => ({
      js: ".jsx",
    }),
    css: {
      minify: true,
    },
    exports: true,
  },
  {
    entry: {
      vite: "src/vite/index.ts",
      env: "src/env.d.ts",
    },
    format: ["esm"],
    dts: true,
    tsconfig: "tsconfig.node.json",
    clean: false,
    platform: "node",
    outExtensions: () => ({
      js: ".js",
    }),
    exports: true,
  },
]);
