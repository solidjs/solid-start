import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { getBody } from "./utils.js";
import vite from "vite";
import fetch from "node-fetch";

globalThis.fetch || (globalThis.fetch = fetch);

async function createServer(root = process.cwd(), configFile) {
  const server = await vite.createServer({
    root,
    configFile,
    logLevel: "info",
    server: {
      middlewareMode: true
    }
  });

  function getApiModules(mod, apiModules = {}) {
    for (var m of mod.importedModules.values()) {
      getApiModules(m, apiModules);
      if (m.id.endsWith(".api.ts")) {
        apiModules[m.id] = m.url;
      }
    }

    return apiModules;
  }

  const app = http.createServer((req, res) => {
    server.middlewares(req, res, async () => {
      try {
        if (req.url === "/favicon.ico") return;

        const { render, renderActions } = await server.ssrLoadModule(
          path.join(path.dirname(fileURLToPath(import.meta.url)), "entries", "devServer.tsx")
        );

        // console.log(
        //   path.resolve(
        //     path.join(
        //       server.config.root,
        //       "src",
        //       "pages",
        //       new URL(req.url, "http://localhost").pathname
        //     )
        //   )
        // );
        // const mod = await server.ssrLoadModule(
        //   "/Users/nikhilsaraf/garage/vinxi/solid-start/examples/with-apiless/src/pages/index.tsx"
        // );

        // const apiModules = getApiModules(
        //   server.moduleGraph.getModuleById(
        //     "/Users/nikhilsaraf/garage/vinxi/solid-start/examples/with-apiless/src/pages/index.tsx"
        //   )
        // );

        if (req.method === "POST") {
          let e;
          const body = await getBody(req);
          if ((e = await renderActions(req.url, body))) {
            res.statusCode = e.status;
            res.write(e.body);
            res.end();
            return;
          }
        }

        res.statusCode = 200;
        res.setHeader("content-type", "text/html");
        console.log("start rendering", req.url);
        await render({ url: req.url, writable: res });
        console.log("end rendering", req.url);
      } catch (e) {
        server && server.ssrFixStacktrace(e);
        console.log(e.stack);
        res.statusCode = 500;
        res.end(e.stack);
      }
    });
  });

  return { app, server };
}

export function start(options) {
  createServer(options.root, options.config).then(({ app }) =>
    app.listen(options.port, () => {
      console.log(`http://localhost:${options.port}`);
    })
  );
}
