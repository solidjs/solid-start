import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { spawn } from "child_process";
import { copyFileSync } from "fs";
import { dirname, join } from "path";
import { rollup } from "rollup";
import { fileURLToPath } from "url";
export default function () {
  return {
    name: "deno",
    start(config, { port }) {
      process.env.PORT = port;
      const proc = spawn(
        "deno",
        ["run", "--allow-net", "--allow-env", "--allow-read", "server.js"],
        {
          cwd: join(process.cwd(), "dist"),
          env: process.env
        }
      );
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
      return `http://localhost:${process.env.PORT}`;
    },
    async build(config, builder) {
      const __dirname = dirname(fileURLToPath(import.meta.url));

      if (!config.solidOptions.ssr) {
        await builder.spaClient(join(config.root, "dist", "public"));
        await builder.server(join(config.root, ".solid", "server"));
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
      const bundle = await rollup({
        input: join(config.root, ".solid", "server", "server.js"),
        plugins: [
          json(),
          nodeResolve({
            preferBuiltins: true,
            exportConditions: ["deno", "solid"]
          }),
          common({ strictRequires: true, ...config.build.commonjsOptions })
        ]
      });
      // or write the bundle to disk
      await bundle.write({ format: "esm", dir: join(config.root, "dist") });

      // closes the bundle
      await bundle.close();
    }
  };
}
