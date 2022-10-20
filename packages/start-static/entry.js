import { readFileSync } from "fs";
import { dirname, join } from "path";
import { createRequest } from "solid-start/node/fetch.js";
import "solid-start/node/globals.js";
import { fileURLToPath } from "url";
import handler from "./handler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "dist", "public", "route-manifest.json"), "utf-8")
);

const MAX_REDIRECTS = 10;
async function handleRequest(req) {
  req.headers = {};
  req.method = "GET";
  const webRes = await handler({
    request: createRequest(req),
    env: { manifest }
  });
  return webRes;
}

export default async req => {
  let webRes = await handleRequest(req);
  if (webRes.status === 200) {
    return webRes.text();
  } else if (webRes.status === 302) {
    console.log(webRes.status);
    let redirects = 1;
    while (redirects < MAX_REDIRECTS) {
      webRes = await handleRequest({ url: webRes.headers.get("location") });
      if (webRes.status === 200) {
        return webRes.text();
      } else if (webRes.status === 302) {
        redirects++;
      } else {
        return "<h1>Error</h1>";
      }
    }
  }
};
