import { copyFileSync, renameSync } from "fs";
import { join, resolve } from "path";
import { rollup } from "rollup";
import { fileURLToPath } from "url";
import vite from "vite";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import common from "@rollup/plugin-commonjs";

export default function ({ edge }) {
  return {
    start() {},
    async build(config) {
      const __dirname = fileURLToPath(new URL(".", import.meta.url));

      const appRoot = config.solidOptions.appRoot;
      await vite.build({
        build: {
          outDir: "./dist/bucket/",
          minify: "terser",
          rollupOptions: {
            input: resolve(join(config.root, appRoot, `entry-client`)),
            output: {
              manualChunks: undefined
            }
          }
        }
      });
      await vite.build({
        build: {
          ssr: true,
          outDir: "./.solid/server",
          rollupOptions: {
            input: resolve(join(config.root, appRoot, `entry-server`)),
            output: {
              format: "esm"
            }
          }
        }
      });
      copyFileSync(
        join(config.root, ".solid", "server", `entry-server.js`),
        join(config.root, ".solid", "server", "app.js")
      );
      copyFileSync(
        join(__dirname, "lambda", edge ? "entry-edge.mjs" : "entry.mjs"),
        join(config.root, ".solid", "server", "index.mjs")
      );
      const bundle = await rollup({
        input: join(config.root, ".solid", "server", "index.mjs"),
        plugins: [
          json(),
          nodeResolve({
            preferBuiltins: true,
            exportConditions: ["node", "solid"]
          }),
          common()
        ]
      });
      // or write the bundle to disk
      await bundle.write({
        format: "esm",
        dir: join(config.root, "dist", "function")
      });
      renameSync(
        join(config.root, "dist", "function", "index.js"),
        join(config.root, "dist", "function", "index.mjs")
      );

      // closes the bundle
      await bundle.close();
    }
  };
}
