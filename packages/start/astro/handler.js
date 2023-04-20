import startHandler from "~/entry-server";

const routeManifest = "$ROUTE_MANIFEST";
const all = async ({ cookies, request, ...args }) => {
  try {
    const load = await startHandler({
      request,
      env: { manifest: routeManifest },
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
  startHandler,
  routeManifest
};
