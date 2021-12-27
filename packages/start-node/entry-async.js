import { renderToStringAsync } from "solid-js/web";
import { createServer } from "solid-start-node/server.js";
import { getBody } from "solid-start/runtime/utils.js";
import prepareManifest from "solid-start/runtime/prepareManifest.js";
import manifest from "../../dist/rmanifest.json";
import assetManifest from "../../dist/manifest.json";
import { render, renderActions } from "./app";
import fetch from "node-fetch";

globalThis.fetch || (globalThis.fetch = fetch);

prepareManifest(manifest, assetManifest);

const { PORT = 3000 } = process.env;

const server = createServer({
  async render(req, res) {
    if (req.url === "/favicon.ico") return;
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

    const html = await renderToStringAsync(render({ url: req.url, manifest }));

    res.statusCode = 200;
    res.setHeader("content-type", "text/html");
    res.end(html);
  }
});

server.listen(PORT, err => {
  if (err) {
    console.log("error", err);
  } else {
    console.log(`Listening on port ${PORT}`);
  }
});
