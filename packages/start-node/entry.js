import { createServer } from "solid-start-node/server.js";
import { createRequest } from "solid-start/runtime/fetch.js";
import prepareManifest from "solid-start/runtime/prepareManifest.js";
import manifest from "../../dist/public/rmanifest.json";
import assetManifest from "../../dist/public/manifest.json";
import { Readable } from "stream";
import { once } from "events";
import * as Streams from "stream/web";
import { fetch, Headers, Response, Request } from "undici";
import entry from "./app";
import crypto from "crypto";
Object.assign(globalThis, Streams, {
  Request,
  Response,
  fetch,
  Headers,
  crypto: crypto.webcrypto
});

prepareManifest(manifest, assetManifest);

const { PORT = 3000 } = process.env;

const server = createServer({
  async render(req, res) {
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
  }
});

server.listen(PORT, err => {
  if (err) {
    console.log("error", err);
  } else {
    console.log(`Listening on port ${PORT}`);
  }
});
