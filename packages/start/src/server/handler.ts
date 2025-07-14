import { sharedConfig } from "solid-js";
import { renderToStream, renderToString } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";
import {
  eventHandler,
  sendRedirect,
  setHeader,
  setResponseStatus,
  type HTTPEvent
} from "vinxi/http";
import { matchAPIRoute } from "../router/routes";
import { getFetchEvent } from "./fetchEvent";
import { createPageEvent } from "./pageEvent";
import type { APIEvent, FetchEvent, HandlerOptions, PageEvent, ResponseStub } from "./types";

// according to https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages
const validRedirectStatuses = new Set([301, 302, 303, 307, 308]);

/**
 * Checks if user has set a redirect status in the response.
 * If not, falls back to the 302 (temporary redirect)
 */
export function getExpectedRedirectStatus(response: ResponseStub): number {
  if (response.status && validRedirectStatuses.has(response.status)) {
    return response.status;
  }

  return 302;
}

export function createBaseHandler(
  fn: (context: PageEvent) => unknown,
  createPageEvent: (event: FetchEvent) => Promise<PageEvent>,
  options: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {},
  routerLoad?: (event: FetchEvent) => Promise<void>
) {
  return eventHandler({
    handler: (e: HTTPEvent) => {
      const event = getFetchEvent(e);

      return provideRequestEvent(event, async () => {
        if (routerLoad) {
          await routerLoad(event);
        }

        // api
        const match = matchAPIRoute(new URL(event.request.url).pathname, event.request.method);
        if (match) {
          const mod = await match.handler.import();
          const fn =
            event.request.method === "HEAD" ? mod["HEAD"] || mod["GET"] : mod[event.request.method];
          (event as APIEvent).params = match.params || {};
          // @ts-ignore
          sharedConfig.context = { event };
          const res = await fn(event);
          if (res !== undefined) return res;
          if (event.request.method !== "GET") {
            throw new Error(
              `API handler for ${event.request.method} "${event.request.url}" did not return a response.`
            );
          }
        }

        // render
        const context = await createPageEvent(event);
        const resolvedOptions =
          typeof options == "function" ? await options(context) : { ...options };
        const mode = resolvedOptions.mode || "stream";
        // @ts-ignore
        if (resolvedOptions.nonce) context.nonce = resolvedOptions.nonce;

        if (mode === "sync" || !import.meta.env.START_SSR) {
          const html = renderToString(() => {
            (sharedConfig.context as any).event = context;
            return fn(context);
          }, resolvedOptions);
          context.complete = true;
          if (context.response && context.response.headers.get("Location")) {
            const status = getExpectedRedirectStatus(context.response);
            return sendRedirect(e, context.response.headers.get("Location")!, status);
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
        const stream = renderToStream(() => {
          (sharedConfig.context as any).event = context;
          return fn(context);
        }, resolvedOptions);
        if (context.response && context.response.headers.get("Location")) {
          const status = getExpectedRedirectStatus(context.response);
          return sendRedirect(e, context.response.headers.get("Location")!, status);
        }
        if (mode === "async") return stream;
        // fix cloudflare streaming
        const { writable, readable } = new TransformStream();
        stream.pipeTo(writable);
        return readable;
      });
    }
  });
}

function handleShellCompleteRedirect(context: PageEvent, e: HTTPEvent) {
  return () => {
    if (context.response && context.response.headers.get("Location")) {
      const status = getExpectedRedirectStatus(context.response);
      setResponseStatus(e, status);
      setHeader(e, "Location", context.response.headers.get("Location")!);
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

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/create-handler
 */
export function createHandler(
  fn: (context: PageEvent) => unknown,
  options?: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>),
  routerLoad?: (event: FetchEvent) => Promise<void>
) {
  return createBaseHandler(fn, createPageEvent, options, routerLoad);
}
