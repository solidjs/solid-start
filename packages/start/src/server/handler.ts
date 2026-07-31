import middleware from "solid-start:middleware";
import manifest from "virtual:solid-manifest";
import { defineHandler, H3, type H3Event, iterable, redirect } from "h3/generic";
import type { JSX } from "@solidjs/web";
import { sharedConfig } from "solid-js";
import { getRequestEvent, renderToStream, renderToString } from "@solidjs/web";

import { decorateHandler, decorateMiddleware } from "./fetchEvent.ts";
import { matchAPIRoute } from "./routes.ts";
import { handleServerFunction } from "../fns/handler.ts";
import type {
  APIEvent,
  FetchEvent,
  HandlerOptions,
  PageEvent,
  ResponseStub,
  StartHandler,
} from "./types.ts";
import { getExpectedRedirectStatus } from "./util.ts";
import { stripPathBase } from "./strip-path-base.ts";

/**
 * Entry-owned CSS for dev SSR. The runtime registers entry assets itself for
 * static (build) manifests, but the dev manifest is an async resolver it
 * can't enumerate — so resolve the client/app entry keys here and register
 * the collected inline styles at render start (pre-shell registrations are
 * injected into <head>, styled from the first byte). Resolution goes through
 * vite-plugin-solid's dev manifest, which reaches the dev server's resolver
 * even from adapter SSR runners that don't share the Vite process (it falls
 * back to the plugin's HTTP bridge endpoint on a registry miss).
 */
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
          (sharedConfig as any).context = { event };
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
      // In dev `virtual:solid-manifest` exports the plugin's live resolver
      // (bridge-backed in isolated runners), so it is usable as-is here too.
      (resolvedOptions as any).manifest = manifest;
      const entryStyles = import.meta.env.DEV
        ? await resolveDevEntryStyles((manifest as Record<string, any>).resolve)
        : undefined;

      if (mode === "sync" || !import.meta.env.START_SSR) {
        const html = renderToString(() => {
          (sharedConfig as any).context.event = context;
          if (entryStyles) registerEntryStyles(entryStyles);
          return fn(context);
        }, resolvedOptions);
        context.complete = true;
        // Cast: router 2.0.0-next.12's RequestEvent augmentation declares the
        // response stub inline, predating the `committed` flag.
        (context.response as ResponseStub).committed = true;

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

      // h3 expects a standard web ReadableStream across runtimes. The
      // renderer's `.readable` view tolerates cancellation while Solid
      // finishes outstanding work (writes after cancel are swallowed).
      return iterable(stream.readable);
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
  // No-JS submission seeding is the router's now: it reads (and clears) the
  // flash cookie itself during SSR initialization. The route tree no longer
  // rides on the event either — apps hand `fileRoutes` to `createRouter`,
  // which shares one immutable tree across every request.
  const pageEvent: PageEvent = Object.assign(ctx, {
    complete: false,
  });

  return pageEvent;
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
    (context.response as ResponseStub).committed = true;
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
