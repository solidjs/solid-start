// @refresh skip

import { H3Event, type Middleware, onResponse } from "h3";
import { getFetchEvent } from "../server/fetchEvent.ts";
import type { FetchEvent } from "../server/types.ts";

export type MiddlewareFn = (event: FetchEvent) => unknown;

// `unknown` because h3 allows any response type like string, json, etc. not just Response
export type RequestMiddleware = (event: FetchEvent) => unknown;

export type ResponseMiddleware = (
  event: FetchEvent,
  response: Response,
) => ReturnType<Parameters<typeof onResponse>[0]>;

function wrapRequestMiddleware(onRequest: RequestMiddleware) {
  return async (h3Event: H3Event) => {
    // h3 onRequest doesn't allow returning a response, but we will for backwards compatibility with start v1
    const fetchEvent = getFetchEvent(h3Event);
    const response = await onRequest(fetchEvent);
    if (response) return response;
  };
}

function wrapResponseMiddleware(onBeforeResponse: ResponseMiddleware): Middleware {
  return onResponse(async (response, h3Event) => {
    const fetchEvent = getFetchEvent(h3Event);
    const mwResponse = await onBeforeResponse(fetchEvent, response.clone());
    if (mwResponse) return mwResponse;
  });
}

export function createMiddleware(
  args?:
    | {
        onRequest?: RequestMiddleware | RequestMiddleware[] | undefined;
        onBeforeResponse?: ResponseMiddleware | ResponseMiddleware[] | undefined;
      }
    | Middleware[],
): Middleware[] {
  if (!args) return [];
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
