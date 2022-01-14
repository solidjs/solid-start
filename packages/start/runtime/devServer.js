import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { getBody } from "./utils.js";
import vite from "vite";
import fetch from "node-fetch";

globalThis.fetch || (globalThis.fetch = fetch);

export function createDevHandler(viteServer) {
  return async (req, res) => {
    try {
      if (req.url === "/favicon.ico") return;

      const { render, renderActions } = await viteServer.ssrLoadModule(
        path.join(path.dirname(fileURLToPath(import.meta.url)), "entries", "devServer.tsx")
      );

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
      render({ url: req.url, writable: res });
    } catch (e) {
      viteServer && viteServer.ssrFixStacktrace(e);
      console.log(e.stack);
      res.statusCode = 500;
      res.end(e.stack);
    }
  };
}

async function createDevServer(root = process.cwd(), configFile) {
  const server = await vite.createServer({
    root,
    configFile,
    logLevel: "info",
    server: {
      middlewareMode: true
    }
  });

  const app = http.createServer((req, res) => {
    server.middlewares(req, res, createDevHandler(server));
  });

  return { app, server };
}

export function start(options) {
  createDevServer(options.root, options.config).then(({ app }) =>
    app.listen(options.port, () => {
      console.log(`http://localhost:${options.port}`);
    })
  );
}
