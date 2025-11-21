import { type EventHandler, getRequestIP, type H3Event, type Middleware } from "h3";
import { provideRequestEvent } from "solid-js/web/storage";
import type { FetchEvent } from "./types.ts";

const FETCH_EVENT_CONTEXT = "solidFetchEvent";

export function createFetchEvent(event: H3Event): FetchEvent {
	return {
		request: event.req,
		response: event.res,
		clientAddress: getRequestIP(event),
		locals: {},
		nativeEvent: event,
	};
}

export function getFetchEvent(h3Event: H3Event): FetchEvent {
	if (!h3Event.context[FETCH_EVENT_CONTEXT]) {
		const fetchEvent = createFetchEvent(h3Event);
		h3Event.context[FETCH_EVENT_CONTEXT] = fetchEvent;
	}

	return h3Event.context[FETCH_EVENT_CONTEXT] as any;
}

export function mergeResponseHeaders(h3Event: H3Event, headers: Headers) {
	for (const [key, value] of headers.entries()) {
		h3Event.res.headers.append(key, value);
	}
}

export const decorateHandler = <T extends EventHandler>(fn: T) =>
	(event => provideRequestEvent(getFetchEvent(event), () => fn(event))) as T;

export const decorateMiddleware = <T extends Middleware>(fn: T) =>
	((event, next) => provideRequestEvent(getFetchEvent(event), () => fn(event, next))) as T;
