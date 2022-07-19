import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { spawn } from "child_process";
import { copyFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { rollup } from "rollup";
import { fileURLToPath } from "url";
import vite from "vite";

export default function () {
  return {
    start() {
      const proc = spawn("npx", [
        "wrangler@2",
        "pages",
        "dev",
        "./dist",
        "--port",
        process.env.PORT ? process.env.PORT : "3000"
      ]);
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
    },
    async build(config, builder) {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const appRoot = config.solidOptions.appRoot;
      await builder.client(join(config.root, "dist"));
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
        join(config.root, ".solid", "server", "handler.js")
      );
      copyFileSync(join(__dirname, "entry.js"), join(config.root, ".solid", "server", "server.js"));
      const bundle = await rollup({
        input: join(config.root, ".solid", "server", "server.js"),
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
        file: join(config.root, "functions", "[[path]].js")
      });

      // closes the bundle
      await bundle.close();
    }
  };
}
