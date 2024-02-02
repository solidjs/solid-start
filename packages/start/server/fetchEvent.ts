import {
  H3Event,
  HTTPEventSymbol,
  appendResponseHeader,
  getRequestIP,
  getResponseHeader,
  getResponseHeaders,
  getResponseStatus,
  getResponseStatusText,
  removeResponseHeader,
  setHeader,
  setResponseHeader,
  setResponseStatus,
  toWebRequest
} from "vinxi/server";
import type { FetchEvent, ResponseStub } from "./types";

const fetchEventSymbol = Symbol("fetchEvent");

export function createFetchEvent(event: H3Event): FetchEvent {
  const request = toWebRequest(event);
  return {
    request: request,
    response: createResponseStub(event),
    clientAddress: getRequestIP(event),
    locals: {},
    nativeEvent: event,
    [HTTPEventSymbol]: event
  };
}

export function cloneEvent<T extends FetchEvent>(fetchEvent: T): T {
  return {
    ...fetchEvent,
    [HTTPEventSymbol]: fetchEvent[HTTPEventSymbol]
  };
}

export function getFetchEvent(h3Event: H3Event): FetchEvent {
  if (!h3Event[fetchEventSymbol]) {
    const fetchEvent = createFetchEvent(h3Event);
    h3Event[fetchEventSymbol] = fetchEvent;
    // @ts-ignore
  }

  return h3Event[fetchEventSymbol];
}

export function mergeResponseHeaders(h3Event, headers) {
  for (const [key, value] of headers.entries()) {
    setHeader(h3Event, key, value);
  }
}

class HeaderProxy {
  constructor(private event: H3Event) {}
  get(key: string) {
    const h = getResponseHeader(this.event, key);
    return Array.isArray(h) ? h.join(", ") : h;
  }
  has(key: string) {
    return this.get(key) !== undefined;
  }
  set(key: string, value: string) {
    return setResponseHeader(this.event, key, value);
  }
  delete(key: string) {
    return removeResponseHeader(this.event, key);
  }
  append(key: string, value: string) {
    appendResponseHeader(this.event, key, value);
  }
  getSetCookie() {
    const cookies = getResponseHeader(this.event, "Set-Cookie");
    return Array.isArray(cookies) ? cookies : [cookies];
  }
  forEach(fn: (value: string, key: string, object: Headers) => void) {
    return this.entries().forEach(([key, value]) => fn(value, key, this));
  }
  entries() {
    return getResponseHeaders(this.event).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(", ") : value
    ]);
  }
  keys() {
    return getResponseHeaders(this.event).map(([key]) => key);
  }
  values() {
    return getResponseHeaders(this.event).map(([key, value]) =>
      Array.isArray(value) ? value.join(", ") : value
    );
  }
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
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
      setResponseStatus(event, getResponseStatus(), v);
    },
    headers: new HeaderProxy(event)
  };
}
