import { copyFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { rollup } from "rollup";
import vite from "vite";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import common from "@rollup/plugin-commonjs";
import { spawn } from "child_process";

export default function () {
  return {
    start() {
      const proc = spawn("wrangler", ["pages dev ./dist"]);
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
    },
    async build(config) {
      const __dirname = dirname(fileURLToPath(
        import.meta.url,
      ));
      const appRoot = config.solidOptions.appRoot;
      await vite.build({
        build: {
          outDir: "./dist/",
          minify: "terser",
          rollupOptions: {
            input: resolve(join(config.root, appRoot, `entry-client`)),
            output: {
              manualChunks: undefined,
            },
          },
        },
      });
      await vite.build({
        build: {
          ssr: true,
          outDir: "./.solid/server",
          rollupOptions: {
            input: resolve(join(config.root, appRoot, `entry-server`)),
            output: {
              format: "esm",
            },
          },
        },
      });
      copyFileSync(
        join(config.root, ".solid", "server", `entry-server.js`),
        join(config.root, ".solid", "server", "app.js"),
      );
      copyFileSync(
        join(__dirname, "entry.js"),
        join(config.root, ".solid", "server", "index.js"),
      );
      const bundle = await rollup({
        input: join(config.root, ".solid", "server", "index.js"),
        plugins: [
          json(),
          nodeResolve({
            preferBuiltins: true,
            exportConditions: ["node", "solid"],
          }),
          common(),
        ],
      });

      // or write the bundle to disk
      await bundle.write({
        format: "esm",
        file: join(config.root, "functions", "[[path]].js"),
      });

      // closes the bundle
      await bundle.close();
    },
  };
}
