import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "cli/index.js",
  output: {
    file: "bin",
    format: "cjs",
    banner: "#!/usr/bin/env node\nglobal.navigator={}",
    interop: false
  },
  plugins: [nodeResolve(), commonjs(), json()],
  external: require("module").builtinModules
};
