import { sharedConfig } from "solid-js";
import { internalFetch } from "../../api/internalFetch";
import { FormError } from "../../data";
import { ServerError } from "../../data/FormError";
import {
  ContentTypeHeader, isRedirectResponse, JSONResponseType,
  LocationHeader,
  XSolidStartContentTypeHeader,
  XSolidStartLocationHeader,
  XSolidStartOrigin,
  XSolidStartResponseTypeHeader
} from "../responses";
import { PageEvent, ServerFunctionEvent } from "../types";
import { CreateServerFunction } from "./types";
export type { APIEvent } from "../../api/types";

export const server$: CreateServerFunction = ((_fn: any) => {
  throw new Error("Should be compiled away");
}) as unknown as CreateServerFunction;

async function parseRequest(event: ServerFunctionEvent) {
  let request = event.request;
  let contentType = request.headers.get(ContentTypeHeader);
  let name = new URL(request.url).pathname,
    args = [];

  if (contentType) {
    if (contentType === JSONResponseType) {
      let text = await request.text();
      try {
        args = JSON.parse(
          text,
          (
            key: string,
            value: {
              $type: "fetch_event";
            }
          ) => {
            if (!value) {
              return value;
            }

            if (value.$type === "fetch_event") {
              return event;
            }

            return value;
          }
        );
      } catch (e) {
        throw new Error(`Error parsing request body: ${text}`);
      }
    } else if (contentType.includes("form")) {
      let formData = await request.clone().formData();
      args = [formData, event];
    }
  }
  return [name, args] as const;
}

export function respondWith(
  request: Request,
  data: Response | Error | FormError | string | object,
  responseType: "throw" | "return"
) {
  if (data instanceof Response) {
    if (isRedirectResponse(data) && request.headers.get(XSolidStartOrigin) === "client") {
      let headers = new Headers(data.headers);
      headers.set(XSolidStartOrigin, "server");
      headers.set(XSolidStartLocationHeader, data.headers.get(LocationHeader) ?? "/");
      headers.set(XSolidStartResponseTypeHeader, responseType);
      headers.set(XSolidStartContentTypeHeader, "response");
      return new Response(null, {
        status: 204,
        statusText: "Redirected",
        headers: headers
      });
    } else if (data.status === 101) {
      // this is a websocket upgrade, so we don't want to modify the response
      return data;
    } else {
      let headers = new Headers(data.headers);
      headers.set(XSolidStartOrigin, "server");
      headers.set(XSolidStartResponseTypeHeader, responseType);
      headers.set(XSolidStartContentTypeHeader, "response");

      return new Response(data.body, {
        status: data.status,
        statusText: data.statusText,
        headers
      });
    }
  } else if (data instanceof FormError) {
    return new Response(
      JSON.stringify({
        error: {
          message: data.message,
          stack: import.meta.env.DEV
            ? `The stack for FormErrors are only logged during development. In production you should handle these errors with an ErrorBoundary that can display the error message appropriately to the user.\n\n${data.stack}`
            : "",
          formError: data.formError,
          fields: data.fields,
          fieldErrors: data.fieldErrors
        }
      }),
      {
        status: 400,
        headers: {
          [XSolidStartResponseTypeHeader]: responseType,
          [XSolidStartContentTypeHeader]: "form-error"
        }
      }
    );
  } else if (data instanceof ServerError) {
    return new Response(
      JSON.stringify({
        error: {
          message: data.message,
          stack: import.meta.env.DEV
            ? `The stack for ServerErrors is only logged during development. In production you should handle these errors with an ErrorBoundary that can display the error message appropriately to the user.\n\n${data.stack}`
            : ""
        }
      }),
      {
        status: data.status,
        headers: {
          [XSolidStartResponseTypeHeader]: responseType,
          [XSolidStartContentTypeHeader]: "server-error"
        }
      }
    );
  } else if (data instanceof Error) {
    console.error(data);
    return new Response(
      JSON.stringify({
        error: {
          message: import.meta.env.DEV
            ? `Internal Server Error (${data.message})`
            : "Internal Server Error",
          stack: import.meta.env.DEV
            ? `This error happened inside a server function and you didn't handle it. So the client will receive an Internal Server Error. You can catch the error and throw a ServerError that makes sense for your UI. In production, the user will have no idea what the error is: \n\n${data.stack}`
            : "",
          status: (data as any).status
        }
      }),
      {
        status: (data as any).status || 500,
        headers: {
          [XSolidStartResponseTypeHeader]: responseType,
          [XSolidStartContentTypeHeader]: "error"
        }
      }
    );
  } else if (
    typeof data === "object" ||
    typeof data === "string" ||
    typeof data === "number" ||
    typeof data === "boolean"
  ) {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        [ContentTypeHeader]: "application/json",
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "json"
      }
    });
  }

  return new Response("null", {
    status: 200,
    headers: {
      [ContentTypeHeader]: "application/json",
      [XSolidStartContentTypeHeader]: "json",
      [XSolidStartResponseTypeHeader]: responseType
    }
  });
}

export async function handleServerRequest(event: ServerFunctionEvent) {
  const url = new URL(event.request.url);

  if (server$.hasHandler(url.pathname)) {
    try {
      let [name, args] = await parseRequest(event);
      let handler = server$.getHandler(name);
      if (!handler) {
        throw {
          status: 404,
          message: "Handler Not Found for " + name
        };
      }
      const data = await handler.call(event, ...(Array.isArray(args) ? args : [args]));
      return respondWith(event.request, data, "return");
    } catch (error) {
      return respondWith(event.request, error as Error, "throw");
    }
  }

  return null;
}

const handlers = new Map();
// server$.requestContext = null;
server$.createHandler = (_fn, hash, serverResource) => {
  // this is run in two ways:
  // called on the server while rendering the App, eg. in a routeData function
  // - pass args as is to the fn, they should maintain identity since they are passed by reference
  // - pass the response/throw the response, as you get it,
  // - except when its a redirect and you are rendering the App,
  //     - then we need to somehow communicate to the central server that this request is a redirect and should set the appropriate headers and status code
  // called on the server when an HTTP request for this server function is made to the server (by a client)
  // - request is parsed to figure out the args that need to be passed here, we still pass the same args as above, but they are not the same reference
  //   as the ones passed in the client. They are cloned and serialized and made as similar to the ones passed in the client as possible
  let fn: any = function (this: PageEvent | any, ...args: any[]) {
    let ctx: any | undefined;

    // if called with fn.call(...), we check if we got a valid RequestContext, and use that as
    // the request context for this server function call
    if (typeof this === "object") {
      ctx = this;
      // @ts-ignore
    } else if (sharedConfig.context && sharedConfig.context.requestContext) {
      // otherwise we check if the sharedConfig has a requestContext, and use that as the request context
      // people shouldn't rely on this
      // @ts-ignore
      ctx = sharedConfig.context.requestContext;
    } else {
      ctx = {
        request: new URL(hash, `http://localhost:${process.env.PORT ?? 3000}`).href,
        responseHeaders: new Headers()
      } as any;
    }

    const execute = async () => {
      try {
        return serverResource ? _fn.call(ctx, args[0], ctx) : _fn.call(ctx, ...args);
      } catch (e) {
        if (e instanceof Error && /[A-Za-z]+ is not defined/.test(e.message)) {
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
  fn.action = function (...args: any[]) {
    return fn.call(this, ...args);
  };

  return fn;
};

server$.registerHandler = function (route, handler) {
  handlers.set(route, handler);
};

server$.getHandler = function (route) {
  return handlers.get(route);
};

server$.hasHandler = function (route) {
  return handlers.has(route);
};

// used to fetch from an API route on the server or client, without falling into
// fetch problems on the server
server$.fetch = internalFetch;
