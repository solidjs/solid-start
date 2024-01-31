import {
  H3Event,
  HTTPEventSymbol,
  getRequestIP,
  toWebRequest
} from "vinxi/server";
import type { FetchEvent } from "./types";

const fetchEventSymbol = Symbol("fetchEvent");

export function createFetchEvent(event: H3Event): FetchEvent {
  const request = toWebRequest(event);
  return {
    request: request,
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