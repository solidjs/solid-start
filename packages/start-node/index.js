import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { rollup } from "rollup";
import { createAdapter } from "solid-start/vite";
import { fileURLToPath, pathToFileURL } from "url";

export default function nodeAdapter() {
  return createAdapter({
    name: "node",
    start: (config, { port }) => {
      process.env.PORT = port;
      import(pathToFileURL(join(config.root, "dist", "server.js")).toString());
      return `http://localhost:${process.env.PORT}`;
    },
    async build(config, builder) {
      const ssrExternal = config?.ssr?.external || [];
      const __dirname = dirname(fileURLToPath(import.meta.url));

      if (!config.solidOptions.ssr) {
        await builder.spaClient(join(config.root, "dist", "public"));
        await builder.server(join(config.root, ".solid", "server"));
      } else if (config.solidOptions.experimental.islands) {
        await builder.islandsClient(join(config.root, "dist", "public"));
        await builder.server(join(config.root, ".solid", "server"));
      } else {
        await builder.client(join(config.root, "dist", "public"));
        await builder.server(join(config.root, ".solid", "server"));
      }

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
          common({ strictRequires: true, ...config.build.commonjsOptions })
        ],
        external: ["stream/web", ...ssrExternal]
      });
      // or write the bundle to disk
      await bundle.write({ format: "esm", dir: join(config.root, "dist") });

      // closes the bundle
      await bundle.close();

      builder.debug(`bundling server done`);
    }
  });
}
