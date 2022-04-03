import { RequestContext } from "../entry-server/StartServer";

// @ts-ignore
const api = $API_ROUTES;

export const apiRoutes = ({ forward }) => {
  return async (ctx: RequestContext) => {
    const url = new URL(ctx.request.url);
    let apiRoute = api.find(({ path }) => url.pathname === path.replace(/\/$/, ""));
    if (apiRoute) {
      const method = ctx.request.method.toLowerCase();
      if (apiRoute[method]) {
        let handler = apiRoute[method];
        const result = await handler(ctx);
        return result;
      }
    }
    return await forward(ctx);
  };
};
