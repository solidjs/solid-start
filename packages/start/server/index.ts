import { isServer } from "solid-js/web";
import type { RequestContext, Middleware as ServerMiddleware } from "../components/StartServer";
import { isRedirectResponse, parseResponse, respondWith } from "./responses";

export { json, redirect, isRedirectResponse } from "./responses";

type InlineServer<T extends (...args: any) => void> = T & {
  url: string;
  fetch(init: RequestInit): Promise<Response>;
};

type ServerFn = (<T extends (...args: any) => void>(fn: T) => InlineServer<T>) & {
  getHandler: (route: string) => any;
  createHandler: (fn: any, hash: string) => any;
  registerHandler: (route: string, handler: any) => any;
  hasHandler: (route: string) => boolean;
  middleware?: Middleware[];
  requestContext?: RequestContext;
  setClientMiddleware: (...middleware: Middleware[]) => void;
  setContext(ctx: RequestContext): void;
  fetch(route: string, init: RequestInit, middleware?: Middleware[]): Promise<Response>;
  getContext(): RequestContext;
  createFetcher(route: string): InlineServer<any>;
};

const server: ServerFn = fn => {
  throw new Error("Should be compiled away");
};

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

if (!isServer) {
  server.middleware = [fetchServerModule()];
  server.setClientMiddleware = (...middleware) => {
    console.log(middleware);
    server.middleware = [...middleware, fetchServerModule()];
  };

  const composeMiddleware =
    exchanges =>
    ({ ctx, next }) =>
      exchanges.reduceRight(
        (next, exchange) =>
          exchange({
            ctx: ctx,
            next
          }),
        next
      );

  function createHandler(...middleware) {
    const handler = composeMiddleware(middleware);
    return async request => {
      return await handler({
        ctx: {
          request
        },
        next: async op => {
          throw new Response(null, {
            status: 404
          });
        }
      })(request);
    };
  }

  function fetchServerModule() {
    return ({ ctx, next }) => {
      return async (req: Request) => {
        return await fetch(req);
      };
    };
  }

  function createRequestInit(...args) {
    let body,
      headers = {
        "x-solidstart-origin": "client"
      };

    if (args.length === 1 && args[0] instanceof FormData) {
      body = args[0];
    } else {
      body = JSON.stringify(args);
      headers["Content-Type"] = "application/json";
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
    let fetcher: any = async (...args: any[]) => {
      const requestInit = createRequestInit(...args);
      // request body: json, formData, or string
      return server.fetch(route, requestInit);
    };

    fetcher.url = route;
    fetcher.fetch = (init: RequestInit) => server.fetch(route, init);
    return fetcher as InlineServer<any>;
  };

  server.fetch = async function (route, init: RequestInit) {
    const request = new Request(route, init);

    const handler = createHandler(...server.middleware);
    const response = await handler(request);

    // throws response, error, form error, json object, string
    if (response.headers.get("X-SolidStart-Response-Type") === "throw") {
      throw await parseResponse(request, response);
    } else if (response.headers.get("X-SolidStart-Response-Type") === "return") {
      return await parseResponse(request, response);
    }

    // fallback if we are getting a response that we dont recognize
    if (
      response.status !== 200 &&
      !response.headers.get("Content-type")?.includes("application/json")
    ) {
      throw response;
    }

    // assumes 200 response with json
    return await response.json();
  };
}

async function parseRequest(request: Request) {
  let contentType = request.headers.get("content-type");
  let name = new URL(request.url).pathname,
    args = [];

  if (contentType) {
    if (contentType === "application/json") {
      args = await request.json();
    } else if (contentType.includes("form")) {
      args = [await request.formData()];
    }
  }
  return [name, args] as const;
}

async function handleServerRequest(ctx: RequestContext) {
  const url = new URL(ctx.request.url);

  let oldContext = server.getContext();
  server.setContext(ctx);

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
      const data = await handler.bind(ctx)(...(Array.isArray(args) ? args : [args]));
      server.setContext(oldContext);
      return respondWith(ctx, data, "return");
    } catch (error) {
      server.setContext(oldContext);
      return respondWith(ctx, error, "throw");
    }
  }

  return null;
}

if (isServer) {
  const handlers = new Map();
  server.requestContext = null;
  server.createHandler = (_fn, hash) => {
    let fn: any = async (...args) => {
      try {
        let e = await _fn(...args);
        if (e instanceof Response) {
          let headers = server.getContext().headers;
          if (headers.get("content-type") === "text/html") {
            headers.set("X-SolidStart-Status-Code", e.status.toString());
            if (isRedirectResponse(e)) {
              headers.set("X-SolidStart-Location", e.headers.get("Location"));
              headers.set("Location", e.headers.get("Location"));
            }
            return e;
          }
        }
        return e;
      } catch (e) {
        if (e instanceof Response) {
          let headers = server.getContext().headers;
          if (headers.get("content-type") === "text/html") {
            headers.set("X-SolidStart-Status-Code", e.status.toString());
            if (isRedirectResponse(e)) {
              headers.set("X-SolidStart-Location", e.headers.get("Location"));
              headers.set("Location", e.headers.get("Location"));
            }
            throw new Error("Response");
          }
        }
        throw e;
      }
    };
    fn.url = `/_m${hash}`;

    return fn;
  };

  server.setContext = (requestContext: RequestContext) => {
    server.requestContext = requestContext;
  };

  server.getContext = () => {
    return server.requestContext;
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

  server.fetch = async function (route, init: RequestInit) {
    // set the request context for server modules that will be called
    // during server side rendering.
    // this is also used for requests made specifically to a server module
    let ctx: RequestContext = {
      request: new Request(route, init),
      headers: new Headers(),
      manifest: {},
      context: {}
    };

    return await handleServerRequest(ctx);
  };
}

export const inlineServerModules: ServerMiddleware = ({ forward }) => {
  return async (ctx: RequestContext) => {
    const url = new URL(ctx.request.url);

    // set the request context for server modules that will be called
    // during server side rendering.
    // this is also used for requests made specifically to a server module
    server.setContext(ctx);

    if (server.hasHandler(url.pathname)) {
      return await handleServerRequest(ctx);
    }

    return await forward(ctx);
  };
};

export default server;

export * from "./responses";
