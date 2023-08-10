import manifest from "../../netlify/route-manifest.json";
import handler from "./entry-server.js";

export default (request, context) => {
  const env = {
      ...context,
      manifest,
      getStaticHTML: path => context.rewrite(new URL(`${path}.html`, request.url).href)
    },
    clientAddress = request.headers.get("x-nf-client-connection-ip");

  function internalFetch(route, init = {}) {
    if (route.startsWith("http")) {
      return fetch(route, init);
    }

    let url = new URL(route, "http://internal");
    const request = new Request(url.href, init);
    return handler({
      request,
      clientAddress,
      locals: {},
      env,
      fetch: internalFetch
    });
  }

  return handler({
    request,
    clientAddress,
    locals: {},
    env,
    fetch: internalFetch
  })
}
