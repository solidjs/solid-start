import * as vite from "vite";

export function loadEnvPlugin(startOpts: { root: string }): vite.Plugin {
  return {
    name: "tanstack-vite-plugin-nitro-load-env",
    enforce: "pre",
    config(userConfig, envConfig) {
      Object.assign(
        process.env,
        vite.loadEnv(envConfig.mode, userConfig.root ?? startOpts.root, "")
      );
    }
  };
}
