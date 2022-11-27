import { Middleware } from "../entry-server";
import { FetchEvent, FETCH_EVENT } from "../server/types";
import { getApiHandler } from "./index";
import { internalFetch } from "./internalFetch";

export const apiRoutes: Middleware = ({ forward }) => {
  return async (event: FetchEvent) => {
    let apiHandler = getApiHandler(new URL(event.request.url), event.request.method);
    if (apiHandler) {
      let responseHeaders = new Headers();
      let apiEvent = Object.freeze({
        request: event.request,
        params: apiHandler.params,
        env: event.env,
        $type: FETCH_EVENT,
        fetch: internalFetch,
        responseHeaders
      });
      try {
        const resp = await apiHandler.handler(apiEvent);
        responseHeaders.forEach((value, name) => {
          resp.headers.append(name, value);
        });
        return resp;
      } catch (error) {
        if (error instanceof Response) {
          return error;
        }
        return new Response(JSON.stringify(error), {
          status: 500
        });
      }
    }
    return await forward(event);
  };
};
