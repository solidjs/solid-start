import { RequestContext } from "../entry-server/StartServer";

// the line below will be replaced by the compiler with a configuration of routes
// based on the files in src/routes
// @ts-ignore
const api = $API_ROUTES;

export function getApiHandler(url: URL, method: string) {
  let apiRoute = api.find(({ path }) => url.pathname === path.replace(/\/$/, ""));
  if (apiRoute) {
    const apiMethod = method.toLowerCase();
    if (apiRoute[apiMethod]) {
      return apiRoute[apiMethod];
    }
  }
}

export const apiRoutes = ({ forward }) => {
  return async (ctx: RequestContext) => {
    let apiHandler = getApiHandler(new URL(ctx.request.url), ctx.request.method);
    if (apiHandler) {
      return await apiHandler(ctx);
    }
    return await forward(ctx);
  };
};
