import { getApiHandler } from "../api";
import { sharedConfig } from "solid-js";
import { isServer } from "solid-js/web";
import type { Middleware as ServerMiddleware } from "../entry-server/StartServer";
import type { RequestContext } from "./types";
import {
  ContentTypeHeader,
  JSONResponseType,
  parseResponse,
  respondWith,
  ResponseError,
  XSolidStartOrigin,
  XSolidStartResponseTypeHeader
} from "./responses";

export { json, redirect, isRedirectResponse } from "./responses";

type InlineServer<E extends any[], T extends (...args: [...E]) => void> = {
  url: string;
  action(...args: [...E]): ReturnType<T>;
  fetch(init: RequestInit): Promise<Response>;
} & ((...args: [...E]) => ReturnType<T>);

type ServerFn = (<E extends any[], T extends (...args: E) => void>(
  fn: T
) => T & { url: string; action: T }) & {
  getHandler: (route: string) => any;
  createHandler: (fn: any, hash: string) => any;
  registerHandler: (route: string, handler: any) => any;
  hasHandler: (route: string) => boolean;
  fetcher: (request: Request) => Promise<Response>;
  setFetcher: (fetcher: (request: Request) => Promise<Response>) => void;
  createFetcher(route: string): InlineServer<any, any>;
  fetch(route: string, init?: RequestInit): Promise<Response>;
} & Pick<RequestContext, "request" | "responseHeaders">;

const server: ServerFn = (fn => {
  throw new Error("Should be compiled away");
}) as unknown as ServerFn;

/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Middleware = (input: MiddlewareInput) => MiddlewareFn;

/** Input parameters for to an Exchange factory function. */
export interface MiddlewareInput {
  ctx: any;
  next: MiddlewareFn;
  // dispatchDebug: <T extends keyof DebugEventTypes | string>(t: DebugEventArg<T>) => void;
}

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export type MiddlewareFn = (request: Request) => Promise<Response>;

// server.setPageResponse = (context, response) => {
//   context.set("x-solidstart-status-code", response.status.toString());

//   console.log(headers, response.headers);

//   response.headers.forEach((head, value) => {
//     context.set(value, head);
//   });
//   return response;
// };

Object.defineProperty(server, "request", {
  get() {
    throw new Error("Should be compiled away");
  }
});

Object.defineProperty(server, "responseHeaders", {
  get() {
    throw new Error("Should be compiled away");
  }
});

if (!isServer || process.env.TEST_ENV === "client") {
  server.fetcher = fetch;
  server.setFetcher = fetch => {
    server.fetcher = fetch;
  };

  function createRequestInit(...args) {
    // parsing args when a request is made from the browser for a server module

    // FormData
    // Request
    // Headers
    //
    let body,
      headers = {
        [XSolidStartOrigin]: "client"
      };

    if (args.length === 1 && args[0] instanceof FormData) {
      body = args[0];
    } else {
      // special case for when server is used as fetcher for createResource
      // we set {}.value to undefined. This keeps the createResource API intact as the type
      // of this object is { value: T | undefined; refetching: boolean }
      // So the user is expected to check value for undefined, and by setting it as undefined
      // we can match user expectations that they dont have access to previous data on
      // the server
      if (Array.isArray(args) && args.length > 2) {
        let secondArg = args[1];
        if (typeof secondArg === "object" && "value" in secondArg && "refetching" in secondArg) {
          secondArg.value = undefined;
        }
      }
      body = JSON.stringify(args, (key, value) => {
        if (value instanceof Headers) {
          return {
            $type: "headers",
            values: [...value.entries()]
          };
        }
        if (value instanceof Request) {
          return {
            $type: "request",
            url: value.url,
            method: value.method,
            headers: value.headers
          };
        }
        return value;
      });
      headers[ContentTypeHeader] = JSONResponseType;
    }

    return {
      method: "POST",
      body: body,
      headers: {
        ...headers
      }
    };
  }

  server.createFetcher = route => {
    let fetcher: any = function (this: Request, ...args: any[]) {
      if (this instanceof Request) {
      }
      const requestInit = createRequestInit(...args);
      // request body: json, formData, or string
      return server.call(route, requestInit);
    };

    fetcher.url = route;
    fetcher.fetch = (init: RequestInit) => server.call(route, init);
    // fetcher.action = async (...args: any[]) => {
    //   const requestInit = createRequestInit(...args);
    //   // request body: json, formData, or string
    //   return server.call(route, requestInit);
    // };
    return fetcher as InlineServer<any, any>;
  };

  server.call = async function (route, init: RequestInit) {
    const request = new Request(new URL(route, window.location.href).href, init);

    const handler = server.fetcher;
    const response = await handler(request);

    // // throws response, error, form error, json object, string
    if (response.headers.get(XSolidStartResponseTypeHeader) === "throw") {
      throw await parseResponse(request, response);
    } else {
      return await parseResponse(request, response);
    }
  };

  // used to fetch from an API route on the server or client, without falling into
  // fetch problems on the server
  server.fetch = async function (route, init: RequestInit) {
    const request = new Request(new URL(route, window.location.href).href, init);

    const handler = server.fetcher;
    const response = await handler(request);

    // // throws response, error, form error, json object, string
    return response;
  };
}

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

if (isServer || process.env.TEST_ENV === "client") {
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
          if (e instanceof Response) {
            // @ts-ignore
            if (ctx) {
              let responseHeaders = ctx.responseHeaders;
              responseHeaders.set("x-solidstart-status-code", e.status.toString());
              e.headers.forEach((head, value) => {
                responseHeaders.set(value, head);
              });
            }
          }

          return e;
        } catch (e) {
          if (e instanceof Response) {
            // @ts-ignore
            if (ctx) {
              let responseHeaders = ctx.responseHeaders;
              responseHeaders.set("x-solidstart-status-code", e.status.toString());
              e.headers.forEach((head, value) => {
                responseHeaders.set(value, head);
              });
            }

            throw new ResponseError(e);
          }

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
    const response = await handler(request);
    return response;
  };
}

export const inlineServerFunctions: ServerMiddleware = ({ forward }) => {
  return async (ctx: RequestContext) => {
    const url = new URL(ctx.request.url);

    if (server.hasHandler(url.pathname)) {
      let contentType = ctx.request.headers.get("content-type");
      let origin = ctx.request.headers.get("x-solidstart-origin");

      let formRequestBody;
      if (
        contentType != null &&
        contentType.includes("form") &&
        !(origin != null && origin.includes("client"))
      ) {
        let [read1, read2] = ctx.request.body.tee();
        formRequestBody = new Request(ctx.request.url, {
          body: read2,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
        ctx.request = new Request(ctx.request.url, {
          body: read1,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
      }

      const serverResponse = await handleServerRequest(ctx);

      let responseContentType = serverResponse.headers.get("x-solidstart-content-type");

      // when a form POST action is made and there is an error throw,
      // and its a non-javascript request potentially,
      // we redirect to the referrer with the form state and error serialized
      // in the url params for the redicted location
      if (
        formRequestBody &&
        responseContentType !== null &&
        responseContentType.includes("error")
      ) {
        const formData = await formRequestBody.formData();
        let entries = [...formData.entries()];
        return new Response(null, {
          status: 302,
          headers: {
            Location:
              new URL(ctx.request.headers.get("referer")).pathname +
              "?form=" +
              encodeURIComponent(
                JSON.stringify({
                  url: url.pathname,
                  entries: entries,
                  ...(await serverResponse.json())
                })
              )
          }
        });
      }
      return serverResponse;
    }

    const response = await forward(ctx);

    if (ctx.responseHeaders.get("x-solidstart-status-code")) {
      return new Response(response.body, {
        status: parseInt(ctx.responseHeaders.get("x-solidstart-status-code")),
        headers: response.headers
      });
    }

    return response;
  };
};

export { inlineServerFunctions as inlineServerModules };

export default server;

export * from "./responses";
export * from "./StartContext";
