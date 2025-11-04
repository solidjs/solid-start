import middleware from "solid-start:middleware";
import { defineHandler, getCookie, H3, type H3Event, redirect, setCookie } from "h3";
import { join } from "pathe";
import type { JSX } from "solid-js";
import { sharedConfig } from "solid-js";
import { getRequestEvent, renderToStream, renderToString } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";

import { createRoutes } from "../router.tsx";
import { getFetchEvent } from "./fetchEvent.ts";
import { getSsrManifest } from "./manifest/ssr-manifest.ts";
import { matchAPIRoute } from "./routes.ts";
import { handleServerFunction } from "./server-functions-handler.ts";
import type {
	APIEvent,
	FetchEvent,
	HandlerOptions,
	PageEvent,
} from "./types.ts";
import { getExpectedRedirectStatus } from "./util.ts";

const SERVER_FN_BASE = "/_server";

export function createBaseHandler(
	createPageEvent: (e: FetchEvent) => Promise<PageEvent>,
	fn: (context: PageEvent) => JSX.Element,
	options:
		| HandlerOptions
		| ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {},
) {
	const handler = defineHandler({
		middleware,
		handler: async (e: H3Event) => {
			const event = getRequestEvent()!;
			const url = new URL(event.request.url);
			const pathname = url.pathname;

			const serverFunctionTest = join("/", SERVER_FN_BASE);
			if (pathname.startsWith(serverFunctionTest)) {
				const serverFnResponse = await handleServerFunction(e);

				if (serverFnResponse instanceof Response) return serverFnResponse;

				return new Response(serverFnResponse as any, {
					headers: e.res.headers,
				});
			}

			const match = matchAPIRoute(pathname, event.request.method);
			if (match) {
				const mod = await match.handler.import();
				const fn =
					event.request.method === "HEAD"
						? mod["HEAD"] || mod["GET"]
						: mod[event.request.method];
				(event as APIEvent).params = match.params || {};
				// @ts-expect-error
				sharedConfig.context = { event };
				const res = await fn!(event);
				if (res !== undefined) return res;
				if (event.request.method !== "GET") {
					throw new Error(
						`API handler for ${event.request.method} "${event.request.url}" did not return a response.`,
					);
				}
				if (!match.isPage) return;
			}

			const context = await createPageEvent(event);

			const resolvedOptions =
				typeof options === "function" ? await options(context) : { ...options };
			const mode = resolvedOptions.mode || "stream";
			if (resolvedOptions.nonce) context.nonce = resolvedOptions.nonce;

			if (mode === "sync" || !import.meta.env.START_SSR) {
				const html = renderToString(() => {
					(sharedConfig.context as any).event = context;
					return fn(context);
				});
				context.complete = true;

				if (context.response && context.response.headers.get("Location")) {
          const status = getExpectedRedirectStatus(context.response);
          return redirect(context.response.headers.get("Location")!, status);
        }

				return html;
			}

			if (resolvedOptions.onCompleteAll) {
        const og = resolvedOptions.onCompleteAll;
        resolvedOptions.onCompleteAll = options => {
          handleStreamCompleteRedirect(context)(options);
          og(options);
        };
      } else resolvedOptions.onCompleteAll = handleStreamCompleteRedirect(context);
      if (resolvedOptions.onCompleteShell) {
        const og = resolvedOptions.onCompleteShell;
        resolvedOptions.onCompleteShell = options => {
          handleShellCompleteRedirect(context, e)();
          og(options);
        };
      } else resolvedOptions.onCompleteShell = handleShellCompleteRedirect(context, e);

			const _stream = renderToStream(() => {
				(sharedConfig.context as any).event = context;
				return fn(context);
			}, resolvedOptions);
      const stream = _stream as typeof _stream & PromiseLike<string>; // stream has a hidden 'then' method

      if (context.response && context.response.headers.get("Location")) {
        const status = getExpectedRedirectStatus(context.response);
        return redirect(context.response.headers.get("Location")!, status);
      }

			if (mode === "async") return await stream

      delete (stream as any).then;

      // using TransformStream in dev can cause solid-start-dev-server to crash
      // when stream is cancelled
      if(globalThis.USING_SOLID_START_DEV_SERVER) return stream

      // returning stream directly breaks cloudflare workers
      const { writable, readable } = new TransformStream();
      stream.pipeTo(writable);
      return readable
		},
	});

	const app = new H3();

	app.use(
		defineHandler((e) =>
			provideRequestEvent(getFetchEvent(e), () => handler(e)),
		),
	);

	return app;
}

export function createHandler(
	fn: (context: PageEvent) => JSX.Element,
	options:
		| HandlerOptions
		| ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {},
) {
	return createBaseHandler(createPageEvent, fn, options);
}

export async function createPageEvent(ctx: FetchEvent) {
	ctx.response.headers.set("Content-Type", "text/html");
	// const prevPath = ctx.request.headers.get("x-solid-referrer");
	// const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
	const manifest = getSsrManifest(import.meta.env.SSR && import.meta.env.DEV ? "ssr": "client");
	const assets = [
    ...(await manifest.getAssets(import.meta.env.START_CLIENT_ENTRY)),
    ...(await manifest.getAssets(import.meta.env.START_APP_ENTRY)),
    // ...(import.meta.env.START_ISLANDS
    //   ? (await serverManifest.inputs[serverManifest.handler]!.assets()).filter(
    //       s => (s as any).attrs.rel !== "modulepreload"
    //     )
    //   : [])
  ];
	const pageEvent: PageEvent = Object.assign(ctx, {
		assets,
		router: {
			submission: initFromFlash(ctx) as any,
		},
		routes: createRoutes(),
		// prevUrl: prevPath || "",
		// mutation: mutation,
		// $type: FETCH_EVENT,
		complete: false,
		$islands: new Set<string>(),
	});

	return pageEvent;
}

function initFromFlash(ctx: FetchEvent) {
	const flash = getCookie(ctx.nativeEvent, "flash");
	if (!flash) return;
	try {
		const param = JSON.parse(flash);
		if (!param || !param.result) return;
		const input = [
			...param.input.slice(0, -1),
			new Map(param.input[param.input.length - 1]),
		];
		const result = param.error ? new Error(param.result) : param.result;
		return {
			input,
			url: param.url,
			pending: false,
			result: param.thrown ? undefined : result,
			error: param.thrown ? result : undefined,
		};
	} catch (e) {
		console.error(e);
	} finally {
		setCookie(ctx.nativeEvent, "flash", "", { maxAge: 0 });
	}
}

function handleShellCompleteRedirect(context: PageEvent, e: H3Event) {
  return () => {
    if (context.response && context.response.headers.get("Location")) {
      const status = getExpectedRedirectStatus(context.response);
      e.res.status = status
      e.res.headers.set("Location", context.response.headers.get("Location")!);
    }
  };
}

function handleStreamCompleteRedirect(context: PageEvent) {
  return ({ write }: { write: (html: string) => void }) => {
    context.complete = true;
    const to = context.response && context.response.headers.get("Location");
    to && write(`<script>window.location="${to}"</script>`);
  };
}
