import { hydrate } from "solid-js/web";
import { StartClient } from "solid-start/components";
import server from "solid-start/server";

function logger({ onLog }) {
  return ({ ctx, next }) => {
    return async req => {
      onLog("request", req);
      const response = await next(req);
      onLog("response", response);
      return response;
    };
  };
}

server.setClientMiddleware(logger({ onLog: console.log }));

hydrate(() => <StartClient />, document);
