// @refresh skip

import type { H3Event, Middleware } from "h3";
import { getFetchEvent } from "../server/fetchEvent.ts";
import type { FetchEvent } from "../server/types.ts";

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */

export type MiddlewareFn = (event: FetchEvent) => Promise<unknown> | unknown;
/** This composes an array of Exchanges into a single ExchangeIO function */

0export type RequestMiddleware = (
  event: FetchEvent,
) => Response | Promise<Response> | void | Promise<void> | Promise<void | Response>;

// copy-pasted from h3/dist/index.d.ts
type EventHandlerResponse<T = any> = T | Promise<T>;
type ResponseMiddlewareResponseParam = { body?: Awaited<EventHandlerResponse> };

export type ResponseMiddleware = (
  event: FetchEvent,
  response: ResponseMiddlewareResponseParam,
) => Response | Promise<Response> | void | Promise<void>;

function wrapRequestMiddleware(onRequest: RequestMiddleware) {
  return async (h3Event: H3Event) => {
    const fetchEvent = getFetchEvent(h3Event);
    const response = await onRequest(fetchEvent);
    if (response) return response;
  };
}

function wrapResponseMiddleware(onBeforeResponse: ResponseMiddleware): Middleware {
  return async (h3Event, next) => {
    const resp = await next();

    const fetchEvent = getFetchEvent(h3Event);
    const mwResponse = await onBeforeResponse(fetchEvent, {
      body: resp,
    });
    if (mwResponse) return mwResponse;
  };
}

/**
 * Creates middleware for handling requests and responses.
 *
 * @see https://docs.solidjs.com/solid-start/reference/server/create-middleware
 */
export function createMiddleware(
  args:
    | {
        /** @deprecated Use H3 `Middleware` instead - https://h3.dev/guide/basics/middleware */
        onRequest?: RequestMiddleware | RequestMiddleware[] | undefined;
        /** @deprecated Use H3 `Middleware` instead - https://h3.dev/guide/basics/middleware */
        onBeforeResponse?: ResponseMiddleware | ResponseMiddleware[] | undefined;
      }
    | Middleware[],
): Middleware[] {
  if (Array.isArray(args)) return args;

  const mw: Middleware[] = [];

  if (typeof args.onRequest === "function") {
    mw.push(wrapRequestMiddleware(args.onRequest));
  } else if (Array.isArray(args.onRequest)) {
    mw.push(...args.onRequest.map(wrapRequestMiddleware));
  }

  if (typeof args.onBeforeResponse === "function") {
    mw.push(wrapResponseMiddleware(args.onBeforeResponse));
  } else if (Array.isArray(args.onBeforeResponse)) {
    mw.push(...args.onBeforeResponse.map(wrapResponseMiddleware));
  }

  return mw;
}
