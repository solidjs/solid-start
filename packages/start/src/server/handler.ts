import { AsyncLocalStorage } from "node:async_hooks";
import middleware from "solid-start:middleware";
import {
  defineHandler,
  getCookie,
  H3,
  type H3Event,
  HTTPError,
  iterable,
  type Middleware,
  redirect,
  setCookie,
} from "h3";
import type { JSX } from "solid-js";
import { sharedConfig } from "solid-js";
import { getRequestEvent, renderToStream, renderToString } from "solid-js/web";

import { createRoutes } from "../router.tsx";
import { decorateHandler, decorateMiddleware } from "./fetchEvent.ts";
import { sendEarlyHints } from "./early-hints.ts";
import { getSsrManifest } from "./manifest/ssr-manifest.ts";
import { matchAPIRoute } from "./api-routes.ts";
import { handleServerFunction } from "../fns/handler.ts";
import type { APIEvent, FetchEvent, HandlerOptions, PageEvent, StartHandler } from "./types.ts";
import { getExpectedRedirectStatus } from "./util.ts";
import { toWebReadableStream } from "./web-stream.ts";
import { stripPathBase } from "./strip-path-base.ts";

const SERVER_FN_BASE = "/_server";

export function createBaseHandler(
  createPageEvent: (e: FetchEvent) => Promise<PageEvent>,
  fn: (context: PageEvent) => JSX.Element,
  options: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {},
  routerLoad?: (event: FetchEvent) => Promise<void>,
): StartHandler {
  const handler = defineHandler({
    middleware: middleware.length ? middleware.map(decorateMiddleware) : undefined,
    handler: decorateHandler(async (e: H3Event) => {
      const event = getRequestEvent()!;
      const url = new URL(event.request.url);
      const pathname = stripBaseUrl(url.pathname);

      if (pathname.startsWith(SERVER_FN_BASE)) {
        return await handleServerFunction(e);
      }

      const match = matchAPIRoute(pathname, event.request.method);
      if (match) {
        const mod = await match.handler.import();
        const fn =
          event.request.method === "HEAD" ? mod["HEAD"] || mod["GET"] : mod[event.request.method];
        if (typeof fn === "function") {
          (event as APIEvent).params = match.params || {};
          // @ts-expect-error
          sharedConfig.context = { event };
          const res = await fn(event);
          if (res !== undefined) {
            return res;
          }
          // A HEAD request runs the `GET` handler when there is no `HEAD` one,
          // so it falls through to the page the same way a `GET` does.
          if (event.request.method !== "GET" && event.request.method !== "HEAD") {
            throw new Error(
              `API handler for ${event.request.method} "${event.request.url}" did not return a response.`,
            );
          }
          if (!match.isPage) return;
        }
      }

      if (routerLoad) await routerLoad(event);

      const context = await createPageEvent(event);

      const resolvedOptions =
        typeof options === "function" ? await options(context) : { ...options };
      const mode = resolvedOptions.mode || "stream";
      if (resolvedOptions.nonce) context.nonce = resolvedOptions.nonce;

      if (mode === "sync" || (!import.meta.env.START_SSR && !import.meta.env.START_SSR_DATA)) {
        const html = renderToString(() => {
          (sharedConfig.context as any).event = context;
          return fn(context);
        }, resolvedOptions);
        context.complete = true;

        if (context.response && context.response.headers.get("Location")) {
          const status = getExpectedRedirectStatus(context.response);
          return redirect(context.response.headers.get("Location")!, status);
        }

        event.response.headers.set("content-type", "text/html");

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

      if (mode === "async") return await stream;

      // h3 expects a standard web ReadableStream across runtimes. The adapter
      // also tolerates cancellation while Solid finishes outstanding work.
      return iterable(toWebReadableStream(stream));
    }),
  });

  const app = new H3();

  app.use(captureUnhandledError(app));
  app.use(handler);

  return throwUnhandledErrors(app);
}

/**
 * A call of a handler's `fetch`: the handler's app, the request passed to the
 * call, whether the app has started on it, and what the request's handler
 * threw when that is not an answer (see `isAnswer`). Wrapped, so that a thrown
 * `undefined` is still found.
 */
type FetchCall = {
  app: H3;
  request: Request;
  started: boolean;
  unhandled?: { thrown: unknown };
};

/**
 * The calls of every handler's `fetch`. One for the module: an instance that
 * has run is only collected after `disable()`.
 */
const calls = new AsyncLocalStorage<FetchCall>();

/**
 * h3 answers whatever a handler throws, so `fetch` would never reject and the
 * server hosting this handler would never see the error: it could neither
 * report it nor answer it its own way. This keeps an unhandled error of the
 * request passed to a `fetch` call away from h3 until that call throws it (see
 * `throwUnhandledErrors`). The app's first start on that request owns the
 * call; any other start is another way in, left as it was:
 * `request()`, where h3 answers it, and an h3 app this one is mounted in,
 * which gets it.
 */
function captureUnhandledError(app: H3): Middleware {
  return async function captureUnhandledError(event, next) {
    const call = calls.getStore();
    const own = call?.app === app && call.request === event.req && !call.started ? call : undefined;
    if (own) own.started = true;
    try {
      return await next();
    } catch (thrown) {
      if (!own || isAnswer(thrown)) throw thrown;
      own.unhandled = { thrown };
      // Never sent: `fetch` throws instead.
      return new Response(null, { status: 500 });
    }
  };
}

/** h3's markers for "no route matched" and "already answered" (`Symbol.for`, as h3 makes them) */
const kNotFound = Symbol.for("h3.notFound");
const kHandled = Symbol.for("h3.handled");

/**
 * Whether h3 answers a thrown value as the response the app asked for: a
 * status thrown as a number, h3's not-found or handled marker, or an h3
 * `HTTPError` not marked as unhandled.
 */
function isAnswer(thrown: unknown): boolean {
  return (
    typeof thrown === "number" ||
    thrown === kNotFound ||
    thrown === kHandled ||
    (isH3Error(thrown) && !thrown.unhandled)
  );
}

/**
 * Other libraries name their errors `HTTPError` too (ky's, got's). h3 takes
 * such an error for its own (any of them before 2.0.1-rc.32, one with a
 * `status` above 99 since), but needs its own error's `toJSON` to answer one.
 */
function isH3Error(thrown: unknown): thrown is HTTPError {
  return HTTPError.isError(thrown) && typeof thrown.toJSON === "function";
}

/**
 * The error the server hosting the handler gets: an `Error` as it was thrown,
 * else an unhandled 500 caused by the thrown value, as h3's own `toError`
 * makes it. An error named `HTTPError` that is not h3's (see `isH3Error`) is
 * wrapped too, keeping its message and stack, so that the host does not take
 * it for an h3 error and answer with its message.
 */
function toError(thrown: unknown): Error {
  if (thrown instanceof Error && (thrown.name !== "HTTPError" || isH3Error(thrown))) return thrown;
  const error = new HTTPError({
    status: 500,
    unhandled: true,
    message: thrown instanceof Error ? thrown.message : undefined,
  });
  (error as { cause: unknown }).cause = thrown;
  if (thrown instanceof Error) error.stack = thrown.stack;
  return error;
}

function throwUnhandledErrors(app: H3): H3 {
  const fetch = app.fetch;
  app.fetch = async request => {
    const call: FetchCall = { app, request, started: false };
    const response = await calls.run(call, () => fetch(request));
    if (call.unhandled) throw toError(call.unhandled.thrown);
    return response;
  };
  return app;
}

export function createHandler(
  fn: (context: PageEvent) => JSX.Element,
  options: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {},
  routerLoad?: (event: FetchEvent) => Promise<void>,
): StartHandler {
  return createBaseHandler(createPageEvent, fn, options, routerLoad);
}

export async function createPageEvent(ctx: FetchEvent) {
  ctx.response.headers.set("Content-Type", "text/html");
  // const prevPath = ctx.request.headers.get("x-solid-referrer");
  // const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
  const manifest = getSsrManifest(import.meta.env.SSR && import.meta.env.DEV ? "ssr" : "client");

  // Handle Vite build.cssCodeSplit
  // When build.cssCodeSplit is false, a single CSS file is generated with the key style.css
  const mergedCSS = import.meta.env.PROD ? await manifest.getAssets("style.css") : [];

  const assets = [
    ...mergedCSS,
    ...(await manifest.getAssets(import.meta.env.START_CLIENT_ENTRY)),
    ...(await manifest.getAssets(import.meta.env.START_APP_ENTRY)),
    // ...(import.meta.env.START_ISLANDS
    //   ? (await serverManifest.inputs[serverManifest.handler]!.assets()).filter(
    //       s => (s as any).attrs.rel !== "modulepreload"
    //     )
    //   : [])
  ];
  sendEarlyHints(ctx, assets);
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
    const input = [...param.input.slice(0, -1), new Map(param.input[param.input.length - 1])];
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
      e.res.status = status;
      e.res.headers.set("Location", context.response.headers.get("Location")!);
    }
  };
}

function handleStreamCompleteRedirect(context: PageEvent) {
  return ({ write }: { write: (html: string) => void }) => {
    context.complete = true;
    const to = context.response && context.response.headers.get("Location");
    if (!to) return;
    // The shell has already flushed, so the redirect has to happen client side.
    // Carry the nonce so a strict `script-src` CSP doesn't block it.
    const nonce = context.nonce ? ` nonce="${escapeAttribute(context.nonce)}"` : "";
    write(
      `<script${nonce}>window.location=${JSON.stringify(to).replace(/</g, "\\u003c")}</script>`,
    );
  };
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function stripBaseUrl(path: string) {
  const base = import.meta.env.SERVER_BASE_URL || "/";
  return stripPathBase(path, base);
}
