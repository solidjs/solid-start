import { sharedConfig } from "solid-js";
import { renderToStream, renderToString } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";
import {
  EventHandlerRequest,
  H3Event,
  eventHandler,
  sendRedirect,
  setHeader,
  setResponseStatus
} from "vinxi/http";
import { matchAPIRoute } from "../shared/routes";
import { getFetchEvent } from "./fetchEvent";
import { createPageEvent } from "./pageEvent";
import type { APIEvent, FetchEvent, HandlerOptions, PageEvent } from "./types";

export function createBaseHandler(
  fn: (context: PageEvent) => unknown,
  createPageEvent: (event: FetchEvent) => Promise<PageEvent>,
  options: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {}
) {
  return eventHandler({
    handler: (e: H3Event<EventHandlerRequest>) => {
      const event = getFetchEvent(e);

      return provideRequestEvent(event, async () => {
        // api
        const match = matchAPIRoute(new URL(event.request.url).pathname, event.request.method);
        if (match) {
          const mod = await match.handler.import();
          const fn = mod[event.request.method];
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
        if (typeof options === "function") options = await options(context);
        const mode = options.mode || "stream";
        // @ts-ignore
        if (options.nonce) context.nonce = options.nonce;
        if (mode === "sync" || !import.meta.env.START_SSR) {
          const html = renderToString(() => {
            (sharedConfig.context as any).event = context;
            return fn(context);
          }, options);
          if (context.response && context.response.headers.get("Location")) {
            return sendRedirect(event, context.response.headers.get("Location")!);
          }
          return html;
        }
        let cloned = { ...options };
        if (cloned.onCompleteAll) {
          const og = cloned.onCompleteAll;
          cloned.onCompleteAll = options => {
            handleStreamCompleteRedirect(context)(options);
            og(options);
          };
        } else cloned.onCompleteAll = handleStreamCompleteRedirect(context);
        if (cloned.onCompleteShell) {
          const og = cloned.onCompleteShell;
          cloned.onCompleteShell = options => {
            handleShellCompleteRedirect(context, e)();
            og(options);
          };
        } else cloned.onCompleteShell = handleShellCompleteRedirect(context, e);
        const stream = renderToStream(() => {
          (sharedConfig.context as any).event = context;
          return fn(context);
        }, cloned);
        if (context.response && context.response.headers.get("Location")) {
          return sendRedirect(event, context.response.headers.get("Location")!);
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

function handleShellCompleteRedirect(context: PageEvent, e: H3Event<EventHandlerRequest>) {
  return () => {
    if (context.response && context.response.headers.get("Location")) {
      setResponseStatus(e, 302);
      setHeader(e, "Location", context.response.headers.get("Location")!);
    }
  };
}

function handleStreamCompleteRedirect(context: PageEvent) {
  return ({ write }: { write: (html: string) => void }) => {
    const to = context.response && context.response.headers.get("Location");
    to && write(`<script>window.location="${to}"</script>`);
  };
}

export function createHandler(
  fn: (context: PageEvent) => unknown,
  options?: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>)
) {
  return createBaseHandler(fn, createPageEvent, options);
}
