import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { rollup } from "rollup";
import vite from "vite";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import common from "@rollup/plugin-commonjs";

export default function () {
  return {
    start(config) {
      import(pathToFileURL(join(config.root, "dist", "index.js")));
    },
    async build(config) {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const appRoot = config.solidOptions.appRoot;

      if (!config.solidOptions.ssr) {
        await vite.build({
          build: {
            outDir: "./dist/public",
            minify: "terser",
            rollupOptions: {
              input: resolve(join(config.root, "index.html")),
              output: {
                manualChunks: undefined
              }
            }
          }
        });

        mkdirSync(join(config.root, ".solid", "server"), {
          recursive: true
        });

        let text = readFileSync(join(__dirname, "spa-handler.js")).toString();
        text = text.replace("INDEX_HTML", `'${join(config.root, "dist", "public", "index.html")}'`);
        console.log(text, join(config.root, "dist", "public", "index.html"));
        writeFileSync(join(config.root, ".solid", "server", "entry-server.js"), text);
      } else {
        await vite.build({
          build: {
            outDir: "./dist/public",
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
      }

      copyFileSync(
        join(config.root, ".solid", "server", `entry-server.js`),
        join(config.root, ".solid", "server", "app.js")
      );
      copyFileSync(join(__dirname, "entry.js"), join(config.root, ".solid", "server", "index.js"));
      const bundle = await rollup({
        input: join(config.root, ".solid", "server", "index.js"),
        plugins: [
          json(),
          nodeResolve({
            preferBuiltins: true,
            exportConditions: ["node", "solid"]
          }),
          common()
        ],
        external: ["undici", "stream/web", "@prisma/client"]
      });
      // or write the bundle to disk
      await bundle.write({ format: "esm", dir: join(config.root, "dist") });

      // closes the bundle
      await bundle.close();

      // unlinkSync(join(config.root, "dist", "public", "manifest.json"));
      // unlinkSync(join(config.root, "dist", "public", "rmanifest.json"));
    }
  };
}
