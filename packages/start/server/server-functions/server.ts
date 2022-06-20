// import { getApiHandler } from "../../api";
import { getRouteMatches } from "../../api/router";
import { sharedConfig } from "solid-js";
import { ContentTypeHeader, JSONResponseType, respondWith } from "../responses";
import { RequestContext } from "../types";
import { ServerFn } from "./types";
import type { Method } from "../../api";

let apiRoutes;

export const registerApiRoutes = routes => {
  apiRoutes = routes;
};

export function getApiHandler(url: URL, method: string) {
  return getRouteMatches(apiRoutes, url.pathname, method.toLowerCase() as Method);
}

export const server: ServerFn = (fn => {
  throw new Error("Should be compiled away");
}) as unknown as ServerFn;

async function parseRequest(request: Request) {
  let contentType = request.headers.get(ContentTypeHeader);
  let name = new URL(request.url).pathname,
    args = [];

  if (contentType) {
    if (contentType === JSONResponseType) {
      let text = await request.text();
      try {
        args = JSON.parse(text, (key, value) => {
          if (!value) {
            return value;
          }
          if (value.$type === "headers") {
            let headers = new Headers();
            request.headers.forEach((value, key) => headers.set(key, value));
            value.values.forEach(([key, value]) => headers.set(key, value));
            return headers;
          }
          if (value.$type === "request") {
            return new Request(value.url, {
              method: value.method,
              headers: value.headers
            });
          }
          return value;
        });
      } catch (e) {
        throw new Error(`Error parsing request body: ${text}`);
      }
    } else if (contentType.includes("form")) {
      let formData = await request.formData();
      args = [formData];
    }
  }
  return [name, args] as const;
}

export async function handleServerRequest(ctx: RequestContext) {
  const url = new URL(ctx.request.url);

  // let oldContext = server.getContext();
  // server.setContext(ctx);
  if (server.hasHandler(url.pathname)) {
    try {
      let [name, args] = await parseRequest(ctx.request);
      let handler = server.getHandler(name);
      if (!handler) {
        throw {
          status: 404,
          message: "Handler Not Found for " + name
        };
      }
      const data = await handler.call(ctx, ...(Array.isArray(args) ? args : [args]));
      // server.setContext(oldContext);
      return respondWith(ctx.request, data, "return");
    } catch (error) {
      // server.setContext(oldContext);
      return respondWith(ctx.request, error, "throw");
    }
  }

  return null;
}

const handlers = new Map();
// server.requestContext = null;
server.createHandler = (_fn, hash) => {
  // this is run in two ways:
  // called on the server while rendering the App, eg. in a routeData function
  // - pass args as is to the fn, they should maintain identity since they are passed by reference
  // - pass the response/throw the response, as you get it,
  // - except when its a redirect and you are rendering the App,
  //     - then we need to somehow communicate to the central server that this request is a redirect and should set the appropriate headers and status code
  // called on the server when an HTTP request for this server function is made to the server (by a client)
  // - request is parsed to figure out the args that need to be passed here, we still pass the same args as above, but they are not the same reference
  //   as the ones passed in the client. They are cloned and serialized and made as similar to the ones passed in the client as possible
  let fn: any = function (...args) {
    let ctx;

    // if called with fn.call(...), we check if we got a valid RequestContext, and use that as
    // the request context for this server function call
    if (typeof this === "object" && this.request instanceof Request) {
      ctx = this;
      // @ts-ignore
    } else if (sharedConfig.context && sharedConfig.context.requestContext) {
      // otherwise we check if the sharedConfig has a requestContext, and use that as the request context
      // people shouldn't rely on this
      // @ts-ignore
      ctx = sharedConfig.context.requestContext;
    } else {
      // this is normally used during a test
      ctx = {
        request: new URL(hash, "http://localhost:3000").href,
        responseHeaders: new Headers()
      };
    }

    const execute = async () => {
      try {
        let e = await _fn.call(ctx, ...args);
        return e;
      } catch (e) {
        if (/[A-Za-z]+ is not defined/.test(e.message)) {
          const error = new Error(
            e.message +
              "\n" +
              " You probably are using a variable defined in a closure in your server function."
          );
          error.stack = e.stack;
          throw error;
        }
        throw e;
      }
    };

    return execute();
  };

  fn.url = hash;
  fn.action = function (...args) {
    return fn.call(this, ...args);
  };

  return fn;
};

server.registerHandler = function (route, handler) {
  handlers.set(route, handler);
};

server.getHandler = function (route) {
  return handlers.get(route);
};

server.hasHandler = function (route) {
  return handlers.has(route);
};

// used to fetch from an API route on the server or client, without falling into
// fetch problems on the server
server.fetch = async function (route, init: RequestInit) {
  let url = new URL(route, "http://localhost:3000");
  const request = new Request(url.href, init);
  const handler = getApiHandler(url, request.method);
  const response = await handler.handler({ request } as RequestContext, handler.params);
  return response;
};
