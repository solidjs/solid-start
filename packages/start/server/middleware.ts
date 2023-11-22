import {
  appendResponseHeader,
  defineMiddleware,
  EventHandlerRequest,
  getRequestIP,
  getResponseHeader,
  getResponseStatus,
  H3Event,
  removeResponseHeader,
  sendRedirect,
  sendWebResponse,
  setResponseHeader,
  setResponseStatus,
  toWebRequest
} from "vinxi/server";
import { FetchEvent } from "./types";

export * from "vinxi/server";

const h3EventSymbol = Symbol("h3Event");
const fetchEventSymbol = Symbol("fetchEvent");

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
    removeResponseHeader: name => removeResponseHeader(event, name),
    // @ts-ignore
    [h3EventSymbol]: event
  };
}

export function getH3Event(fetchEvent: FetchEvent): H3Event<EventHandlerRequest> {
  // @ts-ignore
  return fetchEvent[h3EventSymbol];
}

export function getFetchEvent(h3Event: H3Event): FetchEvent {
  if (!h3Event[fetchEventSymbol]) {
    const fetchEvent = createFetchEvent(h3Event);
    h3Event[fetchEventSymbol] = fetchEvent;
    // @ts-ignore
  }

  return h3Event[fetchEventSymbol];
}

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */

export type MiddlewareFn = (event: FetchEvent) => Promise<unknown> | unknown;
/** This composes an array of Exchanges into a single ExchangeIO function */

type RequestMiddleware = (event: FetchEvent) => Response | Promise<Response> | void | Promise<void>;

type ResponseMiddleware = (
  event: FetchEvent,
  response: Response
) => Response | Promise<Response> | void | Promise<void>;

function wrapRequestMiddleware(onRequest: RequestMiddleware) {
  return async (h3Event: H3Event) => {
    const fetchEvent = getFetchEvent(h3Event);
    const response = await onRequest(fetchEvent);
    if (!response) {
      return;
    } else {
      sendWebResponse(h3Event, response);
    }
  };
}

function wrapResponseMiddleware(onBeforeResponse: ResponseMiddleware) {
  return async (h3Event: H3Event, response: Response) => {
    const fetchEvent = getFetchEvent(h3Event);
    const mwResponse = await onBeforeResponse(fetchEvent, response);
    if (!mwResponse) {
      return;
    } else {
      sendWebResponse(h3Event, mwResponse);
    }
  };
}

export function createMiddleware({
  onRequest,
  onBeforeResponse
}: {
  onRequest?: RequestMiddleware | RequestMiddleware[] | undefined;
  onBeforeResponse?: ResponseMiddleware | ResponseMiddleware[] | undefined;
}) {
  return defineMiddleware({
    onRequest:
      typeof onRequest === "function"
        ? wrapRequestMiddleware(onRequest)
        : Array.isArray(onRequest)
        ? onRequest.map(wrapRequestMiddleware)
        : undefined,
    onBeforeResponse:
      typeof onBeforeResponse === "function"
        ? wrapResponseMiddleware(onBeforeResponse)
        : Array.isArray(onBeforeResponse)
        ? onBeforeResponse.map(wrapResponseMiddleware)
        : undefined
  });
}
