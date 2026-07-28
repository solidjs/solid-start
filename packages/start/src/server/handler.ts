import middleware from "solid-start:middleware";
import {
  defineHandler,
  getCookie,
  H3,
  type H3Event,
  iterable,
  redirect,
  setCookie,
} from "h3/generic";
import type { JSX } from "solid-js";
import { sharedConfig } from "solid-js";
import { getRequestEvent, renderToStream, renderToString } from "solid-js/web";

import { createRoutes } from "../router.tsx";
import { decorateHandler, decorateMiddleware } from "./fetchEvent.ts";
import { getSsrManifest } from "./manifest/ssr-manifest.ts";
import { matchAPIRoute } from "./routes.ts";
import { handleServerFunction } from "../fns/handler.ts";
import { isServerFunctionPath } from "../fns/url.ts";
import type { APIEvent, FetchEvent, HandlerOptions, PageEvent, StartHandler } from "./types.ts";
import { getExpectedRedirectStatus } from "./util.ts";
import { toWebReadableStream } from "./web-stream.ts";
import { stripPathBase } from "./strip-path-base.ts";

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

      if (isServerFunctionPath(pathname)) {
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
          if (event.request.method !== "GET") {
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

  app.use(handler);

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
  const base = import.meta.env.SERVER_BASE_URL || import.meta.env.BASE_URL || "/";
  return stripPathBase(path, base);
}
