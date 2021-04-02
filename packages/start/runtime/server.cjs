const path = require("path");
const http = require("http");
const { parse } = require("url");
const { readFileSync } = require("fs");

async function createServer(root = process.cwd()) {
  const resolve = p => path.resolve(process.cwd(), p);
  const ctx = {};

  const vite = await require("vite").createServer({
    root,
    logLevel: "info",
    server: {
      middlewareMode: true
    }
  });

  const app = http.createServer((req, res) => {
    vite.middlewares(req, res, async () => {
      try {
        const parsed = parse(req.url);

        if (req.url === "/favicon.ico") return;

        let template;
        let render;

        // always read fresh template in dev
        template = readFileSync(resolve("./index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("./lib/entry-server.jsx")).render;

        const { stream, script } = render(parsed.pathname + parsed.search, ctx);

        const [htmlStart, htmlEnd] = template
          .replace(`<!--app-head-->`, script)
          .split(`<!--app-html-->`);

        res.status(200).set({ "content-type": "text/html" });

        res.write(htmlStart);
        stream.pipe(res, { end: false });

        stream.on("end", () => {
          res.write(htmlEnd);
          res.end();
        });
      } catch (e) {
        vite && vite.ssrFixStacktrace(e);
        console.log(e.stack);
        res.status(500).end(e.stack);
      }
    });
  });

  return { app, vite };
}

createServer().then(({ app }) =>
  app.listen(3000, () => {
    console.log("http://localhost:3000");
  })
);
