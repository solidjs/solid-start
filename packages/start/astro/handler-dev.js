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
    const load = await startHandler({
      request,
      env: devEnv,
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
