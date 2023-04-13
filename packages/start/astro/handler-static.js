import { createRequest } from "solid-start/node/fetch.js";
import "solid-start/node/globals.js";

const MAX_REDIRECTS = 10;
async function handleRequest(req) {
  req.headers = {};
  req.method = "GET";
  const webRes = await startHandler({
    request: createRequest(req),
    env: { manifest }
  });
  return webRes;
}

let startHandler;
let manifest;
export default async req => {
  [{ _: { startHandler } }, { default: manifest }] = await Promise.all([
    import(process.env.START_ENTRY_STATIC),
    process.env.START_ENTRY_CLIENT ? { default: {} } : import(new URL('../client/route-manifest.json', import.meta.url).toString(), {
      assert: { type: 'json' }
    })
  ]);
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
