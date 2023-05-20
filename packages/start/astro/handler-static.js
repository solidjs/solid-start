// import { createRequestFromNodeRequest } from "astro/app/node";
import { pathToFileURL } from "node:url";
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
  const { _: { startHandler, routeManifest } } = await import(pathToFileURL(process.env.START_ENTRY_STATIC).toString());
  let webRes = await handleRequest(req, startHandler, process.env.START_INDEX_HTML ? {} : routeManifest);
  if (webRes.status === 200) {
    return webRes.text();
  } else if (webRes.status === 302) {
    let redirects = 1;
    while (redirects < MAX_REDIRECTS) {
      webRes = await handleRequest({ url: webRes.headers.get("location") }, startHandler, process.env.START_INDEX_HTML ? {} : routeManifest);
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
