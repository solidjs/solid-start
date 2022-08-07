import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { rollup } from "rollup";
import { fileURLToPath, pathToFileURL } from "url";

export default function () {
  return {
    start(config) {
      import(pathToFileURL(join(config.root, "dist", "server.js")).toString());
      return `http://localhost:${process.env.PORT || 3000}`;
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

      let text = readFileSync(join(__dirname, "entry.js")).toString();

      writeFileSync(join(config.root, ".solid", "server", "server.js"), text);

      builder.debug(`bundling server with rollup`);

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

      builder.debug(`bundling server done`);
    }
  };
}
