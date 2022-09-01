/// <reference types="node" />

import { spawn } from "child_process";
import { copyFileSync } from "fs";
import { dirname, join, resolve } from "path";
import renderStatic from "solid-ssr/static";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function () {
  return {
    name: "static",
    start(config, { port }) {
      process.env.PORT = port;
      const proc = spawn("npx", ["serve", "./dist/public", "--port", `${process.env.PORT}`]);
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);

      return `http://localhost:${process.env.PORT}`;
    },
    async build(config, builder) {
      const appRoot = config.solidOptions.appRoot;
      await builder.client(join(config.root, "dist", "public"));
      await builder.server(join(config.root, ".solid", "server"));
      copyFileSync(
        join(config.root, ".solid", "server", `entry-server.js`),
        join(config.root, ".solid", "server", "handler.js")
      );
      const pathToServer = join(config.root, ".solid", "server", "server.js");
      copyFileSync(join(__dirname, "entry.js"), pathToServer);
      const pathToDist = resolve(config.root, "dist", "public");
      const pageRoot = join(config.root, appRoot, config.solidOptions.routesDir);
      console.log(pageRoot);

      await config.solidOptions.router.init();
      const routes = [
        ...config.solidOptions.router
          .getFlattenedPageRoutes()
          .map(a => a.path)
          .filter(a => a.includes(":") || a.includes("/")),
        "/404",
        ...(config.solidOptions.prerenderRoutes || [])
      ];
      renderStatic(
        routes.map(url => ({
          entry: pathToServer,
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
