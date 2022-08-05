import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { spawn } from "child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { rollup } from "rollup";
import { fileURLToPath } from "url";
export default function ({ durableObjects = [] } = {}) {
  return {
    // async dev(options, env) {
    //   console.log(await env.createDevMiddleware());
    // },
    start(config) {
      const proc = spawn("node", [
        join(config.root, "node_modules", "wrangler", "bin", "wrangler.js"),
        "dev",
        "./dist/server.js",
        "--site",
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
      } else if (config.solidOptions.islands) {
        await builder.islandsClient(join(config.root, "dist", "public"));
        await builder.server(join(config.root, ".solid", "server"));
      } else {
        await builder.client(join(config.root, "dist", "public"));
        await builder.server(join(config.root, ".solid", "server"));
      }

      copyFileSync(
        join(config.root, ".solid", "server", `entry-server.js`),
        join(config.root, ".solid", "server", "handler.js")
      );
      copyFileSync(join(__dirname, "entry.js"), join(config.root, ".solid", "server", "server.js"));
      if (durableObjects.length > 0) {
        let text = readFileSync(join(config.root, ".solid", "server", "server.js"), "utf8");
        durableObjects.forEach(item => {
          text += `\nexport { ${item} } from "./handler";`;
        });
        writeFileSync(join(config.root, ".solid", "server", "server.js"), text);
      }
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
      await bundle.write({ format: "esm", dir: join(config.root, "dist") });

      // closes the bundle
      await bundle.close();
    }
  };
}
