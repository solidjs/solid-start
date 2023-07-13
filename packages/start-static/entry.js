import { createRequest } from "solid-start/node/fetch.js";
import "solid-start/node/globals.js";
import manifest from "../../dist/public/route-manifest.json";
import handler from "./entry-server.js";

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
  return webRes.text();
};
