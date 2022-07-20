import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { rollup } from "rollup";
import { fileURLToPath, pathToFileURL } from "url";
import vite from "vite";

export default function () {
  return {
    start(config) {
      import(pathToFileURL(join(config.root, "dist", "server.js")).toString());
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
        text = text.replace(
          "INDEX_HTML",
          `'${join(config.root, "dist", "public", "index.html").replace(/\\/g, "\\\\")}'`
        );
        writeFileSync(join(config.root, ".solid", "server", "entry-server.js"), text);
      } else {
        await builder.client(join(config.root, "dist", "public"));

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
        join(config.root, ".solid", "server", "handler.js")
      );

      let text = readFileSync(join(__dirname, "entry.js")).toString();

      writeFileSync(join(config.root, ".solid", "server", "server.js"), text);
      const bundle = await rollup({
        input: join(config.root, ".solid", "server", "server.js"),
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
    }
  };
}
