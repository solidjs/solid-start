import manifest from "../../.vercel/output/static/route-manifest.json";
import entry from "./entry-server";

export default function (request) {
  const env = {
      manifest,
      getStaticHTML: path =>
        new Response(null, {
          headers: {
            "x-middleware-rewrite": new URL(`${path}.html`, request.url).href
          }
        })
    },
    clientAddress = request.headers.get("x-forwarded-for");

  function internalFetch(route, init = {}) {
    if (route.startsWith("http")) {
      return fetch(route, init);
    }

    let url = new URL(route, "http://internal");
    const request = new Request(url.href, init);
    return entry({
      request,
      clientAddress,
      locals: {},
      env,
      fetch: internalFetch
    });
  }

  const response = entry({
    request,
    clientAddress,
    locals: {},
    env,
    fetch: internalFetch
  });
  return response;
}
