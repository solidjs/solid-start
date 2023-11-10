import compression from "compression";
import fs from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import polka from "polka";
import sirv from "sirv";
import { createRequest, handleNodeResponse } from "solid-start/node/fetch.js";

global.onunhandledrejection = (err, promise) => {
  console.error(err);
  console.error(promise);
};

export function createServer({ handler, paths, env }) {
  const comp = compression({
    threshold: 0,
    filter: req => {
      return !req.headers["accept"]?.startsWith("text/event-stream");
    }
  });
  const assets_handler = fs.existsSync(paths.assets)
    ? sirv(paths.assets, {
        setHeaders: (res, pathname) => {
          const isAsset = pathname.startsWith("/assets/");
          if (isAsset) {
            res.setHeader("cache-control", "public, immutable, max-age=31536000");
          }
        }
      })
    : (_req, _res, next) => next();

  const render = async (req, res, server) => {
    try {
      env.getStaticHTML = async assetPath => {
        let text = await readFile(join(paths.assets, assetPath + ".html"), "utf8");
        return new Response(text, {
          headers: {
            "content-type": "text/html"
          }
        });
      };

      function internalFetch(route, init = {}) {
        if (route.startsWith("http")) {
          return fetch(route, init);
        }

        let url = new URL(route, "http://internal");
        const request = new Request(url.href, init);
        console.log("[internal]", url.method, url.href);
        return handler({
          request: request,
          httpServer: server,
          clientAddress: req.socket.remoteAddress,
          locals: {},
          env,
          fetch: internalFetch
        });
      }

      const webRes = await handler({
        request: createRequest(req),
        httpServer: server,
        clientAddress: req.socket.remoteAddress,
        locals: {},
        env,
        fetch: internalFetch
      });

      handleNodeResponse(webRes, res);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.statusMessage = "Internal Server Error";
      res.end();
    }
  };

  const server = polka();
  server.use("/", comp, assets_handler).use(comp, (req, res) => render(req, res, server.server));

  return server;
}
