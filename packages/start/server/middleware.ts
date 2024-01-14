import {
  EventHandlerRequest,
  H3Event,
  defineMiddleware,
  getRequestIP,
  getRequestURL,
  getRequestWebStream,
  sendWebResponse
} from "vinxi/server";
import { FetchEvent } from "./types";

const h3EventSymbol = Symbol("h3Event");
const fetchEventSymbol = Symbol("fetchEvent");
const eventTraps = {
  get(target, prop) {
    if (prop === fetchEventSymbol) return target;
    return target[prop] ?? target[h3EventSymbol][prop];
  }
};

function toWebRequest(/** @type {H3Event} */ event) {
  /**
   * @type {ReadableStream | undefined}
   */
  let readableStream;

  const url = getRequestURL(event);
  const base = {
    // @ts-ignore Undici option
    duplex: "half",
    method: event.method,
    headers: event.headers
  };

  if (event.node.req.body instanceof ArrayBuffer) {
    return new Request(url, {
      ...base,
      body: event.node.req.body
    });
  }

  return new Request(getRequestURL(event), {
    ...base,
    get body() {
      if (readableStream) {
        return readableStream;
      }
      readableStream = getRequestWebStream(event);
      console.log(readableStream);
      return readableStream;
    }
  });
}

export function createFetchEvent(event: H3Event<EventHandlerRequest>): FetchEvent {
  event.web ||
    (event.web = {
      url: getRequestURL(event),
      request: toWebRequest(event)
    });
  return new Proxy(
    {
      request: event.web.request,
      clientAddress: getRequestIP(event),
      locals: {},
      // @ts-ignore
      [h3EventSymbol]: event
    },
    eventTraps
  ) as unknown as FetchEvent;
}

export function cloneEvent<T extends FetchEvent>(fetchEvent: T): T {
  return new Proxy({ ...fetchEvent[fetchEventSymbol] }, eventTraps);
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
