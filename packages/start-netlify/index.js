import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { spawn } from "child_process";
import { copyFileSync, existsSync, promises } from "fs";
import { dirname, join } from "path";
import { rollup } from "rollup";
import { fileURLToPath } from "url";

export default function ({ edge } = {}) {
  return {
    name: "netlify",
    start() {
      const proc = spawn("netlify", ["dev"]);
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
    },
    async build(config, builder) {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      if (!config.solidOptions.ssr) {
        await builder.spaClient(join(config.root, "netlify"));
        await builder.server(join(config.root, ".solid", "server"));
      } else if (config.solidOptions.islands) {
        await builder.islandsClient(join(config.root, "netlify"));
        await builder.server(join(config.root, ".solid", "server"));
      } else {
        await builder.client(join(config.root, "netlify"));
        await builder.server(join(config.root, ".solid", "server"));
      }

      copyFileSync(
        join(config.root, ".solid", "server", `entry-server.js`),
        join(config.root, ".solid", "server", "handler.js")
      );
      copyFileSync(
        join(__dirname, edge ? "entry-edge.js" : "entry.js"),
        join(config.root, ".solid", "server", "index.js")
      );
      const bundle = await rollup({
        input: join(config.root, ".solid", "server", "index.js"),
        plugins: [
          json(),
          nodeResolve({
            preferBuiltins: true,
            exportConditions: edge ? ["deno", "solid"] : ["node", "solid"]
          }),
          common({ strictRequires: true, ...config.build.commonjsOptions })
        ]
      });
      // or write the bundle to disk
      await bundle.write({
        format: "esm",
        inlineDynamicImports: true,
        file: join(config.root, "netlify", edge ? "edge-functions" : "functions", "index.js")
      });

      // closes the bundle
      await bundle.close();

      await promises.writeFile(join(config.root, "netlify", "_headers"), getHeadersFile(), "utf-8");

      if (edge) {
        const dir = join(config.root, ".netlify", "edge-functions");
        if (!existsSync(dir)) {
          await promises.mkdir(dir, { recursive: true });
        }
        await promises.writeFile(
          join(config.root, ".netlify", "edge-functions", "manifest.json"),
          `{
  "functions": [
    {
      "function": "index",
      "pattern": "^[^.]*$"
    }
  ],
  "version": 1
}`,
          "utf-8"
        );
      } else {
        await promises.writeFile(
          join(config.root, "netlify", "_redirects"),
          "/*    /.netlify/functions/index    200",
          "utf-8"
        );
      }
    }
  };
}

/**
 * @see https://docs.netlify.com/routing/headers/
 */
// prettier-ignore
const getHeadersFile = () =>
`
/assets/*
  Cache-Control: public, immutable, max-age=31536000
`.trim();
