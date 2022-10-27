import { FetchEvent, FETCH_EVENT } from "../server/types";
import { getApiHandler } from "./index";

export const apiRoutes = ({ forward }) => {
  return async (event: FetchEvent) => {
    let apiHandler = getApiHandler(new URL(event.request.url), event.request.method);
    if (apiHandler) {
      let apiEvent = Object.freeze({
        request: event.request,
        params: apiHandler.params,
        env: event.env,
        $type: FETCH_EVENT,
        fetch: event.fetch
      });
      try {
        return await apiHandler.handler(apiEvent);
      } catch (error) {
        if (error instanceof Response) {
          return error;
        }
        return new Response(
          JSON.stringify({
            error: error.message
          }),
          {
            headers: {
              "Content-Type": "application/json"
            },
            status: 500
          }
        );
      }
    }
    return await forward(event);
  };
};
