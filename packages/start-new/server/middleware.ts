import {
  appendResponseHeader,
  createMiddleware as createServerMiddleware,
  eventHandler,
  EventHandlerRequest,
  getRequestIP,
  getResponseHeader,
  getResponseStatus,
  H3Event,
  removeResponseHeader,
  sendRedirect,
  setResponseHeader,
  setResponseStatus,
  toWebRequest
} from "vinxi/runtime/server";
import { FetchEvent } from "./types";

export function createFetchEvent(event: H3Event<EventHandlerRequest>): FetchEvent {
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

export function createMiddleware(fn: ({ forward }) => (event: FetchEvent) => Promise<Response>) {
  return createServerMiddleware(({ forward }) => {
    const fetchEventHandler = fn({ forward });
    return eventHandler(h3event => {
      const fetchEvent = createFetchEvent(h3event);
      return fetchEventHandler(fetchEvent);
    });
  });
}
