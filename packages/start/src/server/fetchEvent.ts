import { getRequestIP, type H3Event } from "h3-v2";
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
