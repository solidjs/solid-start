import middleware from "solid-start:middleware";
import { defineHandler, getCookie, H3, type H3Event, redirect, setCookie } from "h3";
import { join } from "pathe";
import type { JSX } from "solid-js";
import { sharedConfig } from "solid-js";
import { getRequestEvent, renderToStream, renderToString } from "solid-js/web";

import { createRoutes } from "../router.tsx";
import { decorateHandler, decorateMiddleware } from "./fetchEvent.ts";
import { getSsrManifest } from "./manifest/ssr-manifest.ts";
import { matchAPIRoute } from "./routes.ts";
import { handleServerFunction } from "./server-functions-handler.ts";
import type { APIEvent, FetchEvent, HandlerOptions, PageEvent } from "./types.ts";
import { getExpectedRedirectStatus } from "./util.ts";

const SERVER_FN_BASE = "/_server";

try {
  const nodeHTTP = await import("http");
  const http2 = await import("http2");

  function patchListen(proto: any) {
    if (!proto || proto.__patched) return;

    const original = proto.listen;
    proto.listen = function (...args: any[]) {
      globalThis.canSendFastNodeStreams = true;
      return original.apply(this, args);
    };

    proto.__patched = true;
  }

  // http + https
  patchListen(nodeHTTP.Server.prototype);

  // http2 (discover prototypes safely)
  patchListen(Object.getPrototypeOf(http2.createServer()));
  patchListen(Object.getPrototypeOf(http2.createSecureServer()));
} catch {}

export function createBaseHandler(
  createPageEvent: (e: FetchEvent) => Promise<PageEvent>,
  fn: (context: PageEvent) => JSX.Element,
  options: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {},
) {
  const handler = defineHandler({
    middleware: middleware.length ? middleware.map(decorateMiddleware) : undefined,
    handler: decorateHandler(async (e: H3Event) => {
      const event = getRequestEvent()!;
      const pathname = stripBaseUrl(e.url.pathname);

      if (pathname.startsWith(SERVER_FN_BASE)) {
        const serverFnResponse = await handleServerFunction(e);

        if (serverFnResponse instanceof Response)
          return produceResponseWithEventHeaders(serverFnResponse);

        return new Response(serverFnResponse as any, {
          headers: e.res.headers,
        });
      }

      const match = matchAPIRoute(pathname, event.request.method);
      if (match) {
        const mod = await match.handler.import();
        const fn =
          event.request.method === "HEAD" ? mod["HEAD"] || mod["GET"] : mod[event.request.method];
        (event as APIEvent).params = match.params || {};
        // @ts-expect-error
        sharedConfig.context = { event };
        const res = await fn!(event);
        if (res !== undefined) {
          if (res instanceof Response) return produceResponseWithEventHeaders(res);

          return res;
        }
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
        }, resolvedOptions);
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

      if (mode === "async") return await stream;

      delete (stream as any).then;

      // using TransformStream in dev can cause solid-start-dev-server to crash
      // when stream is cancelled
      if (globalThis.canSendFastNodeStreams) return stream;

      // returning stream directly breaks cloudflare workers
      const { writable, readable } = new TransformStream();
      stream.pipeTo(writable);
      return readable;
    }),
  });

  const app = new H3();

  app.use(handler);

  return app;
}

export function createHandler(
  fn: (context: PageEvent) => JSX.Element,
  options: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {},
) {
  return createBaseHandler(createPageEvent, fn, options);
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
    to && write(`<script>window.location="${to}"</script>`);
  };
}

function produceResponseWithEventHeaders(res: Response) {
  const event = getRequestEvent()!;

  let ret = res;

  // Response.redirect returns an immutable value, so we clone on any redirect just in case
  if (300 <= res.status && res.status < 400) {
    const cookies = res.headers.getSetCookie?.() ?? [];
    const headers = new Headers();
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        headers.set(key, value);
      }
    });
    for (const cookie of cookies) {
      headers.append("Set-Cookie", cookie);
    }
    ret = new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  const eventCookies = event.response.headers.getSetCookie?.() ?? [];
  for (const cookie of eventCookies) {
    ret.headers.append("Set-Cookie", cookie);
  }

  for (const [name, value] of event.response.headers) {
    if (name.toLowerCase() !== "set-cookie") {
      ret.headers.set(name, value);
    }
  }

  return ret;
}

function stripBaseUrl(path: string) {
  if (import.meta.env.BASE_URL === "/" || import.meta.env.BASE_URL === "") return path;
  return path.slice(import.meta.env.BASE_URL.length);
}
