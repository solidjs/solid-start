import {
  H3Event,
  appendResponseHeader,
  getRequestIP,
  getResponseStatus,
  getResponseStatusText,
  getWebRequest,
  setResponseHeader,
  setResponseStatus
} from "vinxi/http";
import type { FetchEvent, ResponseStub } from "./types";

const fetchEventContext = "solidFetchEvent";

export function createFetchEvent(event: H3Event): FetchEvent {
  return {
    request: getWebRequest(event),
    response: createResponseStub(event),
    clientAddress: getRequestIP(event),
    locals: {},
    nativeEvent: event
  };
}

export function cloneEvent<T extends FetchEvent>(fetchEvent: T): T {
  return {
    ...fetchEvent
  };
}

export function getFetchEvent(h3Event: H3Event): FetchEvent {
  if (!h3Event.context[fetchEventContext]) {
    const fetchEvent = createFetchEvent(h3Event);
    h3Event.context[fetchEventContext] = fetchEvent;
  }

  return h3Event.context[fetchEventContext];
}

export function mergeResponseHeaders(h3Event: H3Event, headers: Headers) {
  for (const [key, value] of headers.entries()) {
    appendResponseHeader(h3Event, key, value);
  }
}
function createHeadersProxy(event: H3Event) {
  const headers = new Headers();

  const origSet = headers.set.bind(headers);
  headers.set = (name, value) => {
    origSet(name, value);
    setResponseHeader(event, name, value);
  };
  const origAppend = headers.append.bind(headers);
  headers.append = (name, value) => {
    origAppend(name, value);
    appendResponseHeader(event, name, value);
  };

  return headers;
}

function createResponseStub(event: H3Event): ResponseStub {
  return {
    get status() {
      return getResponseStatus(event);
    },
    set status(v) {
      setResponseStatus(event, v);
    },
    get statusText() {
      return getResponseStatusText(event);
    },
    set statusText(v) {
      setResponseStatus(event, getResponseStatus(event), v);
    },
    headers: createHeadersProxy(event)
  };
}
