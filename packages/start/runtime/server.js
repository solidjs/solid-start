import path from "path";
import express from "express";
import { readFileSync } from "fs";
import { preload } from "./preload";
import { render } from "../.solid/server";

async function createServer() {
  const resolve = p => path.resolve(__dirname, p);
  const template = readFileSync(resolve("dist/index.html"), "utf-8");
  const manifest = JSON.parse(readFileSync(resolve("dist/rmanifest.json"), "utf-8"));

  const app = express();
  const ctx = {};

  app.use(require("serve-static")(resolve("dist/client"), { index: false }));

  app.use("*", async (req, res) => {
    try {
      const url = req.originalUrl;
      if (url === "/favicon.ico") return res.send("");
      const { stream, script } = render(url, ctx);

      const [htmlStart, htmlEnd] = template
        .replace(`<!--app-head-->`, script)
        .replace(
          `<!--app-preload-->`,
          isProd ? preload(ctx.router[0].current, manifest) || "" : manifest
        )
        .split(`<!--app-html-->`);

      res.status(200).set({ "content-type": "text/html" });

      res.write(htmlStart);
      stream.pipe(res, { end: false });

      stream.on("end", () => {
        res.write(htmlEnd);
        res.end();
      });
    } catch (e) {
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return { app };
}

createServer().then(({ app }) =>
  app.listen(3000, () => {
    console.log("http://localhost:3000");
  })
);
