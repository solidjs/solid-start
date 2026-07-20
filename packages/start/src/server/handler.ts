import middleware from "solid-start:middleware";
import manifest from "virtual:solid-manifest";
import { defineHandler, getCookie, H3, type H3Event, redirect, setCookie } from "h3/generic";
import type { JSX } from "@solidjs/web";
import { sharedConfig } from "solid-js";
import { getRequestEvent, renderToStream, renderToString } from "@solidjs/web";

import { createRoutes } from "../router.tsx";
import { decorateHandler, decorateMiddleware } from "./fetchEvent.ts";
import { matchAPIRoute } from "./routes.ts";
import { handleServerFunction } from "../fns/handler.ts";
import type { APIEvent, FetchEvent, HandlerOptions, PageEvent } from "./types.ts";
import { getExpectedRedirectStatus } from "./util.ts";
import { toWebReadableStream } from "./web-stream.ts";
import { stripPathBase } from "./strip-path-base.ts";

/**
 * Entry-owned CSS for dev SSR. The runtime registers entry assets itself for
 * static (build) manifests, but the dev manifest is an async resolver it
 * can't enumerate — so resolve the client/app entry keys here and register
 * the collected inline styles at render start (pre-shell registrations are
 * injected into <head>, styled from the first byte).
 */
const DEV_MANIFEST_ENDPOINT = "/@solid-start/dev-manifest";

async function resolveDevAssets(request: Request, key: string): Promise<any> {
  // Resolve through the host Vite server because adapter SSR runners may not
  // share the process or global where vite-plugin-solid stores its resolver.
  const url = new URL(DEV_MANIFEST_ENDPOINT, request.url);
  url.searchParams.set("key", key);
  const response = await fetch(url);
  return response.ok ? response.json() : null;
}

async function resolveDevEntryStyles(
  resolve: (key: string) => Promise<any>,
): Promise<any[] | undefined> {
  const keys = [
    import.meta.env.START_CLIENT_ENTRY.replace(/^\.\//, ""),
    import.meta.env.START_APP_ENTRY,
  ];
  const styles: any[] = [];
  for (const key of keys) {
    try {
      const assets = await resolve(key);
      if (assets?.css) styles.push(...assets.css);
    } catch {
      // Entry styles are optional when the dev manifest cannot resolve a key.
    }
  }
  return styles;
}

function registerEntryStyles(styles: any[]) {
  const ctx = (sharedConfig as any).context;
  if (!ctx?.registerAsset) return;
  for (const css of styles) {
    if (typeof css === "string") ctx.registerAsset("style", css);
    else ctx.registerAsset("inline-style", css);
  }
}

const SERVER_FN_BASE = "/_server";

export function createBaseHandler(
  createPageEvent: (e: FetchEvent) => Promise<PageEvent>,
  fn: (context: PageEvent) => JSX.Element,
  options: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {},
): H3 {
  const handler = defineHandler({
    middleware: middleware.length ? middleware.map(decorateMiddleware) : undefined,
    handler: decorateHandler(async (e: H3Event) => {
      const event = getRequestEvent()!;
      const url = new URL(event.request.url);
      const pathname = stripBaseUrl(url.pathname);

      if (pathname.startsWith(SERVER_FN_BASE)) {
        return produceResponseWithEventHeaders(await handleServerFunction(e));
      }

      const match = matchAPIRoute(pathname, event.request.method);
      if (match) {
        const mod = await match.handler.import();
        const fn =
          event.request.method === "HEAD" ? mod["HEAD"] || mod["GET"] : mod[event.request.method];
        if (typeof fn === "function") {
          (event as APIEvent).params = match.params || {};
          (sharedConfig as any).context = { event };
          const res = await fn(event);
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
      }

      const context = await createPageEvent(event);

      const resolvedOptions =
        typeof options === "function" ? await options(context) : { ...options };
      const mode = resolvedOptions.mode || "stream";
      if (resolvedOptions.nonce) context.nonce = resolvedOptions.nonce;
      const renderManifest = import.meta.env.DEV
        ? {
            ...(manifest as Record<string, any>),
            resolve: (key: string) => resolveDevAssets(event.request, key),
          }
        : manifest;
      (resolvedOptions as any).manifest = renderManifest;
      const entryStyles = import.meta.env.DEV
        ? await resolveDevEntryStyles(renderManifest.resolve)
        : undefined;

      if (mode === "sync" || !import.meta.env.START_SSR) {
        const html = renderToString(() => {
          (sharedConfig as any).context.event = context;
          if (entryStyles) registerEntryStyles(entryStyles);
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
        (sharedConfig as any).context.event = context;
        if (entryStyles) registerEntryStyles(entryStyles);
        return fn(context);
      }, resolvedOptions);
      const stream = _stream as typeof _stream & PromiseLike<string>; // stream has a hidden 'then' method

      if (context.response && context.response.headers.get("Location")) {
        const status = getExpectedRedirectStatus(context.response);
        return redirect(context.response.headers.get("Location")!, status);
      }

      if (mode === "async") return await stream;

      delete (stream as any).then;

      // h3 expects a standard web ReadableStream across runtimes. The adapter
      // also tolerates cancellation while Solid finishes outstanding work.
      return toWebReadableStream(stream);
    }),
  });

  const app = new H3();

  app.use(handler);

  return app;
}

export function createHandler(
  fn: (context: PageEvent) => JSX.Element,
  options: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {},
): H3 {
  return createBaseHandler(createPageEvent, fn, options);
}

export async function createPageEvent(ctx: FetchEvent) {
  ctx.response.headers.set("Content-Type", "text/html");
  const pageEvent: PageEvent = Object.assign(ctx, {
    router: {
      submission: initFromFlash(ctx) as any,
    },
    routes: createRoutes(),
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
    to && write(`<script>window.location=${JSON.stringify(to).replace(/</g, "\\u003c")}</script>`);
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
  const base = import.meta.env.SERVER_BASE_URL || import.meta.env.BASE_URL || "/";
  return stripPathBase(path, base);
}
