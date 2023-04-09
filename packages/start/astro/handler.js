import startHandler from "~/entry-server";

let devEnv = {
  __dev: {
    collectStyles(matches) {
      return {};
    },
    manifest: []
  }
};
const all = async ({ cookies, request, ...args }) => {
  try {
    let manifest;
    if (!import.meta.env.DEV) {
      manifest = (await import(new URL('../../../client/route-manifest.json', import.meta.url), {
        assert: { type: 'json' }
      })).default;
    }
    const load = await startHandler({
      request,
      env: manifest ? { manifest }: devEnv,
      clientAddress: request.headers.get("x-forwarded-for"),
      locals: {}
    });
    return load;
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
};
export {
  all
};
