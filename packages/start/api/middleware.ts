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
        $type: FETCH_EVENT
      });

      return await apiHandler.handler(apiEvent);
    }
    return await forward(event);
  };
};
