import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: {
      index: "src/index.tsx",
    },
    format: ["esm"],
    dts: true,
    tsconfig: "tsconfig.build.json",
    clean: true,
    platform: "browser",
    inputOptions: { jsx: "preserve" },
    outExtensions: () => ({
      js: ".jsx",
    }),
    external: ["solid-js", "vite", "sharp", /\.css$/],
  },
  {
    entry: {
      vite: "src/vite/index.ts",
    },
    format: ["esm"],
    dts: true,
    tsconfig: "tsconfig.node.json",
    clean: false,
    platform: "node",
    outExtensions: () => ({
      js: ".js",
    }),
    external: ["solid-js", "vite", "sharp"],
  },
]);
