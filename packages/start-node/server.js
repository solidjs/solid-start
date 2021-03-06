import compression from "compression";
import fs from "fs";
import polka from "polka";
import sirv from "sirv";
import { createRequest } from "solid-start/runtime/fetch.js";
import { Readable } from "stream";
import { once } from "events";

export function createServer({ entry, paths, manifest }) {
  const comp = compression({ threshold: 0 });
  const assets_handler = fs.existsSync(paths.assets)
    ? sirv(paths.assets, {
        maxAge: 31536000,
        immutable: true
      })
    : (_req, _res, next) => next();

  const render = async (req, res) => {
    if (req.url === "/favicon.ico") return;

    const webRes = await entry({
      request: createRequest(req),
      responseHeaders: new Headers(),
      manifest
    });

    res.statusCode = webRes.status;
    res.statusMessage = webRes.statusText;

    for (const [name, value] of webRes.headers) {
      res.setHeader(name, value);
    }

    if (webRes.body) {
      const readable = Readable.from(webRes.body);
      readable.pipe(res);
      await once(readable, "end");
    } else {
      res.end();
    }
  };

  const server = polka().use("/", comp, assets_handler).use(comp, render);

  return server;
}
