import { join } from "node:path";
import { createRequest } from "solid-start/node/fetch.js";
import "solid-start/node/globals.js";

const MAX_REDIRECTS = 10;
async function handleRequest(req, handler, manifest) {
  req.headers = {};
  req.method = "GET";
  const webRes = await handler({
    request: createRequest(req),
    env: { manifest }
  });
  return webRes;
}

export default async req => {
  const [{ _: { startHandler } }, { default: manifest }] = await Promise.all([
    import(process.env.START_ENTRY_STATIC),
    process.env.START_INDEX_HTML ? { default: {} } : import(join(process.env.START_BUILD_SERVER, "route-manifest.json"), {
      assert: { type: 'json' }
    })
  ]);
  let webRes = await handleRequest(req, startHandler, manifest);
  if (webRes.status === 200) {
    return webRes.text();
  } else if (webRes.status === 302) {
    let redirects = 1;
    while (redirects < MAX_REDIRECTS) {
      webRes = await handleRequest({ url: webRes.headers.get("location") }, req, startHandler, manifest);
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
