import { getResponseHeader, getResponseStatus, setResponseHeader, type HTTPEvent } from "vinxi/http";

const CACHE_CONTROL = "Cache-Control";
const DEFAULT_CACHE_CONTROL = "no-store";

function hasEventCacheControl(h3Event: HTTPEvent) {
  return getResponseHeader(h3Event, CACHE_CONTROL) !== undefined;
}

/**
 * A server function answers one caller, so a shared cache must not store the
 * response unless the function opted in with its own `Cache-Control`, either
 * on a returned Response or on the event's response headers. A 304 is left
 * alone: it updates a stored response rather than being one, and `no-store`
 * on it would drop the entry the conditional request was keeping.
 *
 * This runs once the handler has finished rather than up front: forwarded
 * response headers are appended to the event's, so a default already present
 * would be joined with the function's value instead of being replaced by it.
 * h3 writes a returned Response's headers over the event's, so the event's
 * header only reaches the wire when the Response has none of its own.
 */
export function withDefaultCacheControl<T>(h3Event: HTTPEvent, value: T): T {
  if (value instanceof Response) {
    if (value.status === 304 || value.headers.has(CACHE_CONTROL)) return value;
  } else if (getResponseStatus(h3Event) === 304) {
    return value;
  }
  if (!hasEventCacheControl(h3Event)) {
    setResponseHeader(h3Event, CACHE_CONTROL, DEFAULT_CACHE_CONTROL);
  }
  return value;
}

/** h3 answers a thrown value itself, keeping the event's response headers. */
export function setThrownCacheControl(h3Event: HTTPEvent) {
  if (!hasEventCacheControl(h3Event)) {
    setResponseHeader(h3Event, CACHE_CONTROL, DEFAULT_CACHE_CONTROL);
  }
}
