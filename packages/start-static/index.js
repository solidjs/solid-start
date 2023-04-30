/// <reference types="node" />
import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { spawn } from "child_process";
import { copyFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { rollup } from "rollup";
import renderStatic from "solid-ssr/static";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function () {
  return {
    name: "static",
    start(config, { port }) {
      process.env.PORT = port;
      const proc = spawn("npx", ["serve", "./dist/public"]);
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);

      return `http://localhost:${process.env.PORT}`;
    },
    async build(config, builder) {
      if(!config?.solidOptions?.ssr) throw new Error('solid-start-static needs ssr to be enabled for pre-rendering routes at build time');
      const ssrExternal = config?.ssr?.external || [];
      await builder.client(join(config.root, "dist", "public"));
      await builder.server(join(config.root, ".solid", "server"));
      const pathToServer = join(config.root, ".solid", "server", "server.js");
      copyFileSync(join(__dirname, "entry.js"), pathToServer);
      const pathToDist = resolve(config.root, "dist", "public");

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
        external: ["undici", "stream/web", ...ssrExternal]
      });
      // or write the bundle to disk
      await bundle.write({ format: "esm", dir: join(config.root, "dist") });

      // closes the bundle
      await bundle.close();

      builder.debug(`bundling server done`);

      await config.solidOptions.router.init();
      const routes = [
        ...config.solidOptions.router
          .getFlattenedPageRoutes()
          .map(a => a.path)
          .filter(a => (a.includes(":") || a.includes("/")) && !a.includes("*")),
        "/404",
        ...(config.solidOptions.prerenderRoutes || [])
      ];
      renderStatic(
        routes.map(url => ({
          entry: join(config.root, "dist", "server.js"),
          output: join(
            pathToDist,
            url.endsWith("/") ? `${url.slice(1)}index.html` : `${url.slice(1)}.html`
          ),
          url
        }))
      );
    }
  };
}
