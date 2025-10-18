import type { H3Event, HTTPEvent, InferEventInput } from "h3";
import * as h3 from "h3";
import { getRequestEvent } from "solid-js/web";

function _setContext(event: H3Event, key: string, value: any) {
	event.context[key] = value;
}

function _getContext(event: H3Event, key: string) {
	return event.context[key];
}

function getEvent() {
	return getRequestEvent()!.nativeEvent;
}

export function getWebRequest(): Request {
	return getEvent().req;
}

export const HTTPEventSymbol = Symbol("$HTTPEvent");

export function isEvent(
	obj: any,
): obj is h3.H3Event | { [HTTPEventSymbol]: h3.H3Event } {
	return (
		typeof obj === "object" &&
		(obj instanceof h3.H3Event ||
			obj?.[HTTPEventSymbol] instanceof h3.H3Event ||
			obj?.__is_event__ === true)
	);
	// Implement logic to check if obj is an H3Event
}

type Tail<T> = T extends [any, ...infer U] ? U : never;

type PrependOverload<
	TOriginal extends (...args: Array<any>) => any,
	TOverload extends (...args: Array<any>) => any,
> = TOverload & TOriginal;

// add an overload to the function without the event argument
type WrapFunction<TFn extends (...args: Array<any>) => any> = PrependOverload<
	TFn,
	(
		...args: Parameters<TFn> extends [
			h3.HTTPEvent<any> | h3.H3Event<any>,
			...infer TArgs,
		]
			? TArgs
			: Parameters<TFn>
	) => ReturnType<TFn>
>;

function createWrapperFunction<TFn extends (...args: Array<any>) => any>(
	h3Function: TFn,
): WrapFunction<TFn> {
	return ((...args: Array<any>) => {
		const event = args[0];
		if (!isEvent(event)) {
			args.unshift(getEvent());
		} else {
			args[0] =
				event instanceof h3.H3Event || (event as any).__is_event__
					? event
					: event[HTTPEventSymbol];
		}

		return (h3Function as any)(...args);
	}) as any;
}

// Creating wrappers for each utility and exporting them with their original names
// readRawBody => getWebRequest().text()/.arrayBuffer()
type WrappedReadBody = <T, TEventInput = InferEventInput<"body", H3Event, T>>(
	...args: Tail<Parameters<typeof h3.readBody<T, H3Event, TEventInput>>>
) => ReturnType<typeof h3.readBody<T, h3.H3Event, TEventInput>>;
export const readBody = createWrapperFunction(h3.readBody) as PrependOverload<
	typeof h3.readBody,
	WrappedReadBody
>;
type WrappedGetQuery = <
	T,
	TEventInput = Exclude<InferEventInput<"query", H3Event, T>, undefined>,
>(
	...args: Tail<Parameters<typeof h3.getQuery<T, H3Event, TEventInput>>>
) => ReturnType<typeof h3.getQuery<T, H3Event, TEventInput>>;
export const getQuery = createWrapperFunction(h3.getQuery) as PrependOverload<
	typeof h3.getQuery,
	WrappedGetQuery
>;
export const isMethod = createWrapperFunction(h3.isMethod);
export const isPreflightRequest = createWrapperFunction(h3.isPreflightRequest);
type WrappedGetValidatedQuery = <
	T extends HTTPEvent,
	TEventInput = InferEventInput<"query", H3Event, T>,
>(
	...args: Tail<
		Parameters<typeof h3.getValidatedQuery<T, H3Event, TEventInput>>
	>
) => ReturnType<typeof h3.getValidatedQuery<T, H3Event, TEventInput>>;
export const getValidatedQuery = createWrapperFunction(
	h3.getValidatedQuery,
) as PrependOverload<typeof h3.getValidatedQuery, WrappedGetValidatedQuery>;
export const getRouterParams = createWrapperFunction(h3.getRouterParams);
export const getRouterParam = createWrapperFunction(h3.getRouterParam);
type WrappedGetValidatedRouterParams = <
	T extends HTTPEvent,
	TEventInput = InferEventInput<"routerParams", H3Event, T>,
>(
	...args: Tail<
		Parameters<typeof h3.getValidatedRouterParams<T, H3Event, TEventInput>>
	>
) => ReturnType<typeof h3.getValidatedRouterParams<T, H3Event, TEventInput>>;
export const getValidatedRouterParams = createWrapperFunction(
	h3.getValidatedRouterParams,
) as PrependOverload<
	typeof h3.getValidatedRouterParams,
	WrappedGetValidatedRouterParams
>;
export const assertMethod = createWrapperFunction(h3.assertMethod);
export const getRequestHeaders = createWrapperFunction(h3.getRequestHeaders);
export const getRequestHeader = createWrapperFunction(h3.getRequestHeader);
export const getRequestURL = createWrapperFunction(h3.getRequestURL);
export const getRequestHost = createWrapperFunction(h3.getRequestHost);
export const getRequestProtocol = createWrapperFunction(h3.getRequestProtocol);
export const getRequestIP = createWrapperFunction(h3.getRequestIP);
export const setResponseStatus = (code?: number, text?: string) => {
	const e = getEvent();

	if (e.res.status !== undefined) e.res.status = code;
	if (e.res.statusText !== undefined) e.res.statusText = text;
};
export const getResponseStatus = () => getEvent().res.status;
export const getResponseStatusText = () => getEvent().res.statusText;
export const getResponseHeaders = () =>
	Object.fromEntries(getEvent().res.headers.entries());
export const getResponseHeader = (name: string) =>
	getEvent().res.headers.get(name);
export const setResponseHeaders = (values: Record<string, string>) => {
	const headers = getEvent().res.headers;
	for (const [name, value] of Object.entries(values)) {
		headers.set(name, value);
	}
};
export const setResponseHeader = (name: string, value: string | string[]) => {
	const headers = getEvent().res.headers;

	(Array.isArray(value) ? value : [value]).forEach((value) => {
		headers.set(name, value);
	});
};
export const appendResponseHeaders = (values: Record<string, string>) => {
	const headers = getEvent().res.headers;
	for (const [name, value] of Object.entries(values)) {
		headers.append(name, value);
	}
};
export const appendResponseHeader = (
	name: string,
	value: string | string[],
) => {
	const headers = getEvent().res.headers;

	(Array.isArray(value) ? value : [value]).forEach((value) => {
		headers.append(name, value);
	});
};
export const defaultContentType = (type: string) =>
	getEvent().res.headers.set("content-type", type);
export const proxyRequest = createWrapperFunction(h3.proxyRequest);
export const fetchWithEvent = createWrapperFunction(h3.fetchWithEvent);
export const getProxyRequestHeaders = createWrapperFunction(
	h3.getProxyRequestHeaders,
);

export const parseCookies = createWrapperFunction(h3.parseCookies);
export const getCookie = createWrapperFunction(h3.getCookie);
export const setCookie = createWrapperFunction(h3.setCookie);
export const deleteCookie = createWrapperFunction(h3.deleteCookie);
// not exported :(
type SessionDataT = Record<string, any>;
type WrappedUseSession = <T extends SessionDataT>(
	...args: Tail<Parameters<typeof h3.useSession<T>>>
) => ReturnType<typeof h3.useSession<T>>;
export const useSession: WrappedUseSession = createWrapperFunction(
	h3.useSession,
);
type WrappedGetSession = <T extends SessionDataT>(
	...args: Tail<Parameters<typeof h3.getSession<T>>>
) => ReturnType<typeof h3.getSession<T>>;
export const getSession: WrappedGetSession = createWrapperFunction(
	h3.getSession,
);
type WrappedUpdateSession = <T extends SessionDataT>(
	...args: Tail<Parameters<typeof h3.updateSession<T>>>
) => ReturnType<typeof h3.updateSession<T>>;
export const updateSession: WrappedUpdateSession = createWrapperFunction(
	h3.updateSession,
);
type WrappedSealSession = <T extends SessionDataT>(
	...args: Tail<Parameters<typeof h3.sealSession<T>>>
) => ReturnType<typeof h3.sealSession<T>>;
export const sealSession: WrappedSealSession = createWrapperFunction(
	h3.sealSession,
);
export const unsealSession = createWrapperFunction(h3.unsealSession);
export const clearSession = createWrapperFunction(h3.clearSession);
export const handleCacheHeaders = createWrapperFunction(h3.handleCacheHeaders);
export const handleCors = createWrapperFunction(h3.handleCors);
export const appendCorsHeaders = createWrapperFunction(h3.appendCorsHeaders);
export const appendCorsPreflightHeaders = createWrapperFunction(
	h3.appendCorsPreflightHeaders,
);
export const appendHeader = appendResponseHeader;
export const appendHeaders = appendResponseHeaders;
export const setHeader = setResponseHeader;
export const setHeaders = setResponseHeaders;
export const getHeader = getResponseHeader;
export const getHeaders = getResponseHeaders;
export const getRequestFingerprint = createWrapperFunction(
	h3.getRequestFingerprint,
);
export const getRequestWebStream = () => getEvent().req.body;
export const readFormData = () => getEvent().req.formData();
type WrappedReadValidatedBody = <
	T extends HTTPEvent,
	TEventInput = InferEventInput<"body", H3Event, T>,
>(
	...args: Tail<
		Parameters<typeof h3.readValidatedBody<T, H3Event, TEventInput>>
	>
) => ReturnType<typeof h3.readValidatedBody<T, H3Event, TEventInput>>;
export const readValidatedBody = createWrapperFunction(
	h3.readValidatedBody,
) as PrependOverload<typeof h3.readValidatedBody, WrappedReadValidatedBody>;
export const getContext = createWrapperFunction(_getContext);
export const setContext = createWrapperFunction(_setContext);
export const removeResponseHeader = (name: string) =>
	getEvent().res.headers.delete(name);
export const clearResponseHeaders = (headerNames?: string[]) => {
	const headers = getEvent().res.headers;

	if (headerNames && headerNames.length > 0) {
		for (const name of headerNames) {
			headers.delete(name);
		}
	} else {
		for (const name of headers.keys()) {
			headers.delete(name);
		}
	}
};
