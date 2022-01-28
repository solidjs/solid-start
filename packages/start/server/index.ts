import { isServer } from "solid-js/web";
import type { RequestContext, Middleware as ServerMiddleware } from "../components/StartServer";
import { FormError, respondWith } from "./responses";

type InlineServer<T extends (...args: any) => void> = T & {
  url: string;
  fetch(init: RequestInit): Promise<Response>;
};

type ServerFn = (<
  T extends (...args: any) => void
  // Params extends Parameters<T>,
  // Data extends ReturnType<T>
>(
  fn: T
) => InlineServer<T>) & {
  getHandler: (route: string) => any;
  createHandler: (fn: any, hash: string) => any;
  registerHandler: (route: string, handler: any) => any;
  hasHandler: (route: string) => boolean;
  middleware?: Middleware[];
  requestContext?: RequestContext;
  setClientMiddleware: (...middleware: Middleware[]) => void;
  setContext(ctx: RequestContext): void;
  getContext(): RequestContext;
  createFetcher(route: string): InlineServer<any>;
};

const server: ServerFn = fn => {
  throw new Error("Should be compiled away");
};

/**
 * A JSON response. Converts `data` to JSON and sets the `Content-Type` header.
 */
export function json<Data>(data: Data, init: number | ResponseInit = {}): Response {
  let responseInit: any = init;
  if (typeof init === "number") {
    responseInit = { status: init };
  }

  let headers = new Headers(responseInit.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers
  });
}

/**
 * A redirect response. Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 */
export function redirect(
  url: string,
  // we use 204 no content to signal that the response body is empty
  // and the X-Location header should be used instead to do the redirect client side
  init: number | ResponseInit = 302
): Response {
  let responseInit = init;
  if (typeof responseInit === "number") {
    responseInit = { status: responseInit };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }

  // let headers = new Headers();
  // headers.set("Location", url);
  console.log(responseInit);
  return new Response(null, {
    ...responseInit,
    headers: {
      ...responseInit.headers,
      "X-SolidStart-Location": url,
      Location: url
    }
  });
}

export function isResponse(value: any): value is Response {
  return (
    value != null &&
    typeof value.status === "number" &&
    typeof value.statusText === "string" &&
    typeof value.headers === "object" &&
    typeof value.body !== "undefined"
  );
}

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
export function isRedirectResponse(response: Response): boolean {
  return redirectStatusCodes.has(response.status);
}

export function isCatchResponse(response: Response) {
  return response.headers.get("X-Remix-Catch") != null;
}

export function extractData(response: Response): Promise<unknown> {
  let contentType = response.headers.get("Content-Type");

  if (contentType && /\bapplication\/json\b/.test(contentType)) {
    return response.json();
  }

  // What other data types do we need to handle here? What other kinds of
  // responses are people going to be returning from their loaders?
  // - application/x-www-form-urlencoded ?
  // - multipart/form-data ?
  // - binary (audio/video) ?

  return response.text();
}

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

  function createRequest(route, ...args) {
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

    return new Request(route, {
      method: "POST",
      body: body,
      headers: {
        ...headers
      }
    });
  }

  async function parseResponse(request: Request, response: Response) {
    const contentType =
      response.headers.get("X-SolidStart-Content-Type") || response.headers.get("Content-Type");

    if (contentType.includes("json")) {
      return await response.json();
    } else if (contentType.includes("text")) {
      return await response.text();
    } else if (contentType.includes("form-error")) {
      const data = await response.json();
      return new FormError(data.error.message, { fieldErrors: data.error.fieldErrors });
    } else if (contentType.includes("error")) {
      const data = await response.json();
      return new Error(data.error.message);
    } else if (contentType.includes("response")) {
      if (response.status === 204 && response.headers.get("X-SolidStart-Location")) {
        return redirect(response.headers.get("X-SolidStart-Location"));
      }
      return response;
    }
  }

  server.createFetcher = (route, middleware = []) => {
    console.log(route, middleware);

    let fetcher: any = async (...args) => {
      const handler = createHandler(...middleware, ...server.middleware);

      const request = createRequest(route, ...args);
      // request body: json, formData, or string
      const response = await handler(request);

      // throws response, error, form error, json object, string
      if (response.headers.get("X-SolidStart-Response-Type") === "throw") {
        throw parseResponse(request, response);
      } else if (response.headers.get("X-SolidStart-Response-Type") === "return") {
        return parseResponse(request, response);
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

    fetcher.url = route;
    fetcher.fetch = (init: RequestInit) => {};
    return fetcher as InlineServer<any>;
  };
}

if (isServer) {
  const handlers = new Map();
  server.requestContext = null;
  server.createHandler = (fn, hash) => {
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
    console.log(handlers, route);
    return handlers.get(route);
  };

  server.hasHandler = function (route) {
    return handlers.has(route);
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

export const inlineServerModules: ServerMiddleware = ({ forward }) => {
  return async (ctx: RequestContext) => {
    const url = new URL(ctx.request.url);

    // set the request context for server modules that will be called
    // during server side rendering.
    // this is also used for requests made specifically to a server module
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
        console.log("hereee", args);
        const data = await handler.bind(ctx)(...(Array.isArray(args) ? args : [args]));
        console.log("theree");
        return respondWith(ctx, data, "return");
      } catch (error) {
        console.log(error);
        return respondWith(ctx, error, "throw");
      }
    }

    return await forward(ctx);
  };
};

export default server;

export * from "./responses";
