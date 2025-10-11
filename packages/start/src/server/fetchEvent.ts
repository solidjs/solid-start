import {
	appendResponseHeader,
	getRequestIP,
	getResponseHeader,
	getResponseHeaders,
	getResponseStatus,
	getResponseStatusText,
	type H3Event,
	removeResponseHeader,
	setResponseHeader,
	setResponseStatus,
	toWebRequest,
} from "h3";
import type { FetchEvent, ResponseStub } from "./types.ts";

const FETCH_EVENT_CONTEXT = "solidFetchEvent";

export function createFetchEvent(event: H3Event): FetchEvent {
	return {
		request: toWebRequest(event),
		response: createResponseStub(event),
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

	return h3Event.context[FETCH_EVENT_CONTEXT];
}

export function mergeResponseHeaders(h3Event: H3Event, headers: Headers) {
	for (const [key, value] of headers.entries()) {
		appendResponseHeader(h3Event, key, value);
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
			setResponseStatus(event, getResponseStatus(event), v);
		},
		headers: new HeaderProxy(event),
	};
}

class HeaderProxy {
	constructor(private event: H3Event) {}
	get(key: string) {
		const h = getResponseHeader(this.event, key);
		return Array.isArray(h) ? h.join(", ") : (h as string) || null;
	}
	has(key: string) {
		return this.get(key) !== null;
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
		return Array.isArray(cookies) ? cookies : [cookies as string];
	}
	forEach(fn: (value: string, key: string, object: Headers) => void) {
		return Object.entries(getResponseHeaders(this.event)).forEach(
			([key, value]) =>
				fn(
					Array.isArray(value) ? value.join(", ") : (value as string),
					key,
					this,
				),
		);
	}
	entries() {
		return Object.entries(getResponseHeaders(this.event))
			.map(
				([key, value]) =>
					[key, Array.isArray(value) ? value.join(", ") : value] as [
						string,
						string,
					],
			)
			[Symbol.iterator]();
	}
	keys() {
		return Object.keys(getResponseHeaders(this.event))[Symbol.iterator]();
	}
	values() {
		return Object.values(getResponseHeaders(this.event))
			.map((value) =>
				Array.isArray(value) ? value.join(", ") : (value as string),
			)
			[Symbol.iterator]();
	}
	[Symbol.iterator]() {
		return this.entries()[Symbol.iterator]();
	}
}
