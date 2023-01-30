import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import esbuild from 'rollup-plugin-esbuild';
import { copyFileSync, renameSync } from "fs";
import { join } from "path";
import { rollup } from "rollup";
import { fileURLToPath } from "url";

export default function ({ edge, clientAddress, method } = {}) {
  return {
    name: "aws",
    start() {},
    async build(config, builder) {
      const __dirname = fileURLToPath(new URL(".", import.meta.url));

      // SSR Edge Function
      if (!config.solidOptions.ssr) {
        await builder.spaClient(join(config.root, "dist", "client"));
        await builder.server(join(config.root, ".solid", "server"));
      } else if (config.solidOptions.islands) {
        await builder.islandsClient(join(config.root, "dist", "client"));
        await builder.server(join(config.root, ".solid", "server"));
      } else {
        await builder.client(join(config.root, "dist", "client"));
        await builder.server(join(config.root, ".solid", "server"));
      }

      if (edge) {
        copyFileSync(
          join(__dirname, "entry-edge.mjs"),
          join(config.root, ".solid", "server", "index.mjs")
        );
      } else {
        let js = readFileSync(join(__dirname, "entry.mjs"))
        if (clientAddress) {
          js = js.replace('requestContext.identity.sourceIp', clientAddress);
        }
        if (method) {
          js = js.replace('event.requestContext.http.method', method);
        }
        writeFileSync(join(config.root, ".solid", "server", "index.mjs"), js);
      }
      copyFileSync(
        join(__dirname, edge ? "entry-edge.mjs" : "entry.ts"),
        join(config.root, ".solid", "server", "index.mjs")
      );
      const bundle = await rollup({
        input: join(config.root, ".solid", "server", "index.ts"),
        plugins: [
          esbuild(),
          json(),
          nodeResolve({
            preferBuiltins: true,
            exportConditions: ["node", "solid"]
          }),
          common({ strictRequires: true, ...config.build.commonjsOptions })
        ]
      });
      await bundle.write({
        format: "esm",
        dir: join(config.root, "dist", "server")
      });
      renameSync(
        join(config.root, "dist", "server", "index.js"),
        join(config.root, "dist", "server", "index.mjs")
      );

      // closes the bundle
      await bundle.close();
    }
  };
}
