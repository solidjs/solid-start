import manifest from "../../netlify/route-manifest.json";
import handler from "./entry-server.js";

export default (request, context) =>
  handler({
    request,
    clientAddress: request.headers.get('x-nf-client-connection-ip'),
    locals: {},
    env: {
      ...context,
      manifest,
      getStaticHTML: path => context.rewrite(new URL(`${path}.html`, request.url).href)
    }
  });
