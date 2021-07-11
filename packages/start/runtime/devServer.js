import path from "path";
import http from "http";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import serverScripts from "./serverScripts.js";
import { getBody } from "./utils.js";
import vite from "vite";

async function createServer(root = process.cwd()) {
  const resolve = p => path.resolve(root, p);

  const server = await vite.createServer({
    root,
    logLevel: "info",
    server: {
      middlewareMode: true
    }
  });

  const app = http.createServer((req, res) => {
    server.middlewares(req, res, async () => {
      try {
        if (req.url === "/favicon.ico") return;
        let template;

        // always read fresh template in dev
        template = readFileSync(resolve("./index.html"), "utf-8");
        template = await server.transformIndexHtml(req.url, template);
        const { render, renderActions } = await server.ssrLoadModule(
          path.join(path.dirname(fileURLToPath(import.meta.url)), "server", "nodeStream", "app.jsx")
        );

        if (req.method === "POST") {
          let e;
          const body = await getBody(req);
          if (e = await renderActions(req.url, body)) {
            res.statusCode = e.status;
            res.write(e.body);
            res.end();
            return;
          }
        }

        const { add, get } = serverScripts();
        const { stream, script } = render(req.url, { add });

        const [htmlStart, htmlEnd] = template
          .replace(`<!--app-head-->`, script + get())
          .split(`<!--app-html-->`);

        res.statusCode = 200;
        res.setHeader("content-type", "text/html");

        res.write(htmlStart);
        stream.pipe(res, { end: false });

        stream.on("end", () => {
          res.write(htmlEnd);
          res.end();
        });
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
  createServer(options.root).then(({ app }) =>
    app.listen(options.port, () => {
      console.log(`http://localhost:${options.port}`);
    })
  );
}
