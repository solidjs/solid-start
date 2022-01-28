type Server = (<T>(fn: T) => T) & {
  fetcher<T>(url: string, options?: RequestInit): (...args: any) => Promise<T>;

  getHandler: (hash: string) => any;
  registerHandler: (hash: string, handler: any) => any;
  handler: any;
  requestContext: any;
  setRequest(ctx: RequestContext): void;
  getRequest(): RequestContext;
};

import type { Middleware, RequestContext } from "../components/StartServer";
import { isServer } from "solid-js/web";
import { INLINE_SERVER_ROUTE_PREFIX } from "./constants.js";
const server: Server = fn => {
  throw new Error("Should be compiled away");
};

if (!isServer) {
  server.fetcher = (route: string, { body = null, headers = {}, method = "POST" } = {}) => {
    return async (...args: any) => {
      let response = await fetch(route, {
        method: method || "POST",
        body: body || JSON.stringify(args),
        headers: {
          "Content-Type": "application/json",
          "X-SolidStart-Origin": "client",
          ...headers
        }
      });
      return await response.json();
    };
  };
}

if (isServer) {
  const handlers = new Map();
  server.requestContext = null;
  server.handler = fn => {
    return fn;
  };

  server.setRequest = ctx => {
    server.requestContext = ctx;
  };

  server.getRequest = () => {
    return server.requestContext;
  };

  server.registerHandler = function (hash, handler) {
    handlers.set(hash, handler);
  };

  server.getHandler = function (hash) {
    console.log(handlers, hash);
    return handlers.get(hash);
  };
}

export default server;

export const inlineServerModules: Middleware = ({ forward }) => {
  return async (ctx: RequestContext) => {
    const url = new URL(ctx.request.url);

    server.setRequest(ctx);

    if (url.pathname.startsWith(INLINE_SERVER_ROUTE_PREFIX)) {
      let json = await ctx.request.json();
      let handler = server.getHandler(url.pathname);
      if (!handler)
        return new Response(
          JSON.stringify({
            status: 404,
            body: "Not Found"
          }),
          {
            status: 404
          }
        );
      try {
        const data = await handler.bind(ctx)(...json);
        return new Response(JSON.stringify(data), {
          status: 200
        });
      } catch (error) {
        return new Response(JSON.stringify(error), {
          status: 500
        });
      }
    }

    return await forward(ctx);
  };
};
