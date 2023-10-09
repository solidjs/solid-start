import manifest from "../../netlify/route-manifest.json";
import handler from "./entry-server.js";

export default async (request, context) => {
  const env = {
      ...context,
      manifest,
      getStaticHTML: path => context.rewrite(new URL(`${path}.html`, request.url).href)
    },
    clientAddress = request.headers.get("x-nf-client-connection-ip");

  // First check for static assets, to avoid shadowing them.
  const asset = await context.next(request.clone());
  if (asset.status !== 404) {
    return asset;
  }

  function internalFetch(route, init = {}) {
    const url = new URL(route, request.url);
    return fetch(url, init);
  }

  return handler({
    request,
    clientAddress,
    locals: {},
    env,
    fetch: internalFetch
  });
};
