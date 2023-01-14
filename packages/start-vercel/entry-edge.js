import manifest from "../../.vercel/output/static/route-manifest.json";
import entry from "./entry-server";

export default function (request) {
  const response = entry({
    request,
    clientAddress: request.headers.get('x-forwarded-for'),
    locals: {},
    env: {
      manifest,
      getStaticHTML: path =>
        new Response(null, {
          headers: {
            "x-middleware-rewrite": new URL(`${path}.html`, request.url).href
          }
        })
    }
  });
  return response;
}
