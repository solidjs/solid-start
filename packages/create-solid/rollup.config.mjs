import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { builtinModules } from "module";

export default {
  input: "cli/index.js",
  output: {
    file: "bin",
    format: "cjs",
    banner: "#!/usr/bin/env node\nglobal.navigator={}",
    interop: "default",
    inlineDynamicImports: true
  },
  plugins: [nodeResolve(), commonjs(), json()],
  external: builtinModules
};
