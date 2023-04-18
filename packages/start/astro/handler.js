import "solid-start/node/globals.js";
import startHandler from "~/entry-server";

let manifest;
const all = async ({ cookies, request, ...args }) => {
  try {
    if (!manifest) {
      manifest = (await import(/* @vite-ignore */new URL('../../route-manifest.json', import.meta.url).toString(), {
        assert: { type: 'json' }
      })).default;
    }
    const load = await startHandler({
      request,
      env: { manifest },
      clientAddress: request.headers.get("x-forwarded-for"),
      locals: {}
    });
    return load;
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
};
export {
  all,
  startHandler
};
