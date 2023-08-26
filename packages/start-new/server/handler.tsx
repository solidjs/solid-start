import {
  appendResponseHeader,
  eventHandler,
  EventHandlerRequest,
  getRequestIP,
  getResponseHeader,
  getResponseStatus,
  H3Event,
  removeResponseHeader,
  send,
  sendRedirect,
  setResponseHeader,
  setResponseStatus,
  toWebRequest
} from "vinxi/runtime/server";
import { FETCH_EVENT, FetchEvent, PageEvent } from "./types";

import { renderToStream } from "solid-js/web";
import { createRoutes } from "../shared/FileRoutes";
import { apiRoutes } from "../shared/routes";

export type Middleware = (input: MiddlewareInput) => MiddlewareFn;

/** Input parameters for to an Exchange factory function. */
export interface MiddlewareInput {
  forward: MiddlewareFn;
}

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export type MiddlewareFn = (event: FetchEvent) => Promise<unknown> | unknown;

/** This composes an array of Exchanges into a single ExchangeIO function */
export const composeMiddleware =
  (exchanges: Middleware[]) =>
  ({ forward }: MiddlewareInput) =>
    exchanges.reduceRight(
      (forward, exchange) =>
        exchange({
          forward
        }),
      forward
    );

export function createHandler(...exchanges: Middleware[]) {
  const exchange = composeMiddleware(exchanges);
  return eventHandler(async (event: H3Event<EventHandlerRequest>) => {
    return await exchange({
      forward: async op => {
        setResponseStatus(event, 404);
        return await send(event);
      }
    })(createFetchEvent(event));
  });
}

function api() {
  return ({ forward }) => {
    return async event => {
      const match = apiRoutes.find(
        route =>
          route[`$${event.request.method}`] && new URL(event.request.url).pathname === route.path
      );
      if (match) {
        const mod = await match[`$${event.request.method}`].import();
        const fn = mod[event.request.method];
        const result = await fn(event);
        return result;
      }
      return forward(event);
    };
  };
}

export function render(
  fn: (context: PageEvent) => unknown,
  options?: { nonce?: string; renderId?: string; timeoutMs?: number }
) {
  return composeMiddleware([
    api(),
    () => {
      return async event => {
        const context = await createPageEvent(event);
        const stream = renderToStream(() => fn(context), options);
        if (context.routerContext && context.routerContext.url) {
          return event.redirect(context.routerContext.url);
        }
        return { pipeTo: stream.pipeTo };
      };
    }
  ]);
}

function createFetchEvent(event: H3Event<EventHandlerRequest>) {
  return {
    request: toWebRequest(event),
    clientAddress: getRequestIP(event),
    locals: {},
    redirect: (url, status) => sendRedirect(event, url, status),
    getResponseStatus: () => getResponseStatus(event),
    setResponseStatus: (code, text) => setResponseStatus(event, code, text),
    getResponseHeader: name => getResponseHeader(event, name),
    setResponseHeader: (name, value) => setResponseHeader(event, name, value),
    appendResponseHeader: (name, value) => appendResponseHeader(event, name, value),
    removeResponseHeader: name => removeResponseHeader(event, name)
  };
}

async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"];
  const serverManifest = import.meta.env.MANIFEST["ssr"];
  const prevPath = ctx.request.headers.get("x-solid-referrer");
  const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
  const pageEvent: PageEvent = {
    ...ctx,
    manifest: await clientManifest.json(),
    assets: [
      ...(await clientManifest.inputs[clientManifest.handler].assets()),
      ...(import.meta.env.START_ISLANDS
        ? await serverManifest.inputs[serverManifest.handler].assets()
        : [])
    ],
    routes: createRoutes(),
    prevUrl: prevPath || "",
    routerContext: {} as any,
    mutation: mutation,
    tags: [],
    $type: FETCH_EVENT,
    $islands: new Set<string>()
  };

  return pageEvent;
}
