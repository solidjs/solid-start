import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { spawn } from "child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { rollup } from "rollup";
import { fileURLToPath } from "url";
import { build } from "vite";

export default function () {
  return {
    start(config) {
      const proc = spawn("node", [
        join(config.root, "node_modules", "wrangler", "bin", "wrangler.js"),
        "pages",
        "dev",
        "./dist/public",
        "--port",
        process.env.PORT ? process.env.PORT : "3000"
      ]);
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
    },
    async build(config, builder) {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const appRoot = config.solidOptions.appRoot;
      if (!config.solidOptions.ssr) {
        await builder.spaClient(join(config.root, "dist", "public"));

        mkdirSync(join(config.root, ".solid", "server"), {
          recursive: true
        });

        let text = readFileSync(join(__dirname, "spa-handler.js")).toString();
        writeFileSync(join(config.root, ".solid", "server", "entry-server.js"), text);
      } else {
        await builder.client(join(config.root, "dist", "public"));
        await build({
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
      }
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
