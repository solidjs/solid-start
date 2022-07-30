import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { spawn } from "child_process";
import { copyFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { rollup } from "rollup";
import { fileURLToPath } from "url";

export default function () {
  return {
    start() {
      const proc = spawn("vercel");
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
    },
    async build(config, builder) {
      // Vercel Build Output API v3 (https://vercel.com/docs/build-output-api/v3)
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const appRoot = config.solidOptions.appRoot;
      const outputDir = join(config.root, ".vercel/output");

      // Static Files
      await builder.client(join(outputDir, "static"));

      // SSR Edge Function
      if (!config.solidOptions.ssr) {
        await builder.spaClient(join(outputDir, "static"));
      } else if (config.solidOptions.islands) {
        await builder.islandsClient(join(outputDir, "static"));
        await builder.server(join(config.root, ".solid", "server"));
      } else {
        await builder.client(join(outputDir, "static"));
        await builder.server(join(config.root, ".solid", "server"));
      }

      const entrypoint = join(config.root, ".solid", "server", "server.js");
      copyFileSync(join(__dirname, "entry.js"), entrypoint);
      const bundle = await rollup({
        input: entrypoint,
        plugins: [
          json(),
          nodeResolve({
            preferBuiltins: true,
            exportConditions: ["node", "solid"]
          }),
          common()
        ]
      });

      const renderEntrypoint = "index.js";
      const renderFuncDir = join(outputDir, "functions/render.func");
      await bundle.write({
        format: "esm",
        file: join(renderFuncDir, renderEntrypoint)
      });
      await bundle.close();

      const renderConfig = {
        runtime: "edge",
        entrypoint: renderEntrypoint
      };
      writeFileSync(join(renderFuncDir, ".vc-config.json"), JSON.stringify(renderConfig, null, 2));

      // Routing Config
      const outputConfig = {
        version: 3,
        routes: [
          // Serve any matching static assets first
          { handle: "filesystem" },
          // Invoke the SSR function if not a static asset
          { src: "/.*", middlewarePath: "render" }
        ]
      };
      writeFileSync(join(outputDir, "config.json"), JSON.stringify(outputConfig, null, 2));
    }
  };
}
