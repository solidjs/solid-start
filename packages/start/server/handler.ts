import { sharedConfig } from "solid-js";
import { renderToStream } from "solid-js/web";
/* @ts-ignore */
import { provideRequestEvent } from "solid-js/web/storage";
import {
  EventHandlerObject,
  EventHandlerRequest,
  H3Event,
  HTTPMethod,
  eventHandler,
  sendRedirect,
  setHeader,
  setResponseStatus
} from "vinxi/server";
import { matchAPIRoute } from "../shared/routes";
import { getFetchEvent } from "./fetchEvent";
import { createPageEvent } from "./pageEvent";
import { APIEvent, FetchEvent, PageEvent } from "./types";

export function createBaseHandler(
  fn: (context: PageEvent) => unknown,
  options: {
    nonce?: string;
    renderId?: string;
    timeoutMs?: number;
    onCompleteAll?: (options: { write: (v: any) => void }) => void;
    onCompleteShell?: (options: { write: (v: any) => void }) => void;
    createPageEvent?: (event: FetchEvent) => Promise<PageEvent>;
    onRequest?: EventHandlerObject["onRequest"];
    onBeforeResponse?: EventHandlerObject["onBeforeResponse"];
  } = {}
) {
  return eventHandler({
    onRequest: options.onRequest,
    onBeforeResponse: options.onBeforeResponse,
    handler: (e: H3Event<EventHandlerRequest> & { startEvent: FetchEvent }) => {
      const event = getFetchEvent(e);

      return provideRequestEvent(event, async () => {
        // api
        const match = matchAPIRoute(new URL(event.request.url).pathname, event.request.method as HTTPMethod)
        if (match) {
          const mod = await match.handler.import();
          const fn = mod[event.request.method];
          (event as APIEvent).params = match.params;
          sharedConfig.context = { event } as any;
          return await fn(event);
        }

        // render stream
        const doAsync = import.meta.env.START_SSR === "async";
        const context = await createPageEvent(event);
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
          return fn(context)
        }, cloned);
        if (context.response && context.response.headers.get("Location")) {
          return sendRedirect(event, context.response.headers.get("Location"));
        }
        if (doAsync) return stream;
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
      setHeader(e, "Location", context.response.headers.get("Location"));
    }
  }
}

function handleStreamCompleteRedirect(context: PageEvent) {
  return ({ write }: { write: (html: string) => void }) => {
    const to = context.response && context.response.headers.get("Location");
    to && write(`<script>window.location="${to}"</script>`);
  };
}

export function createHandler(
  fn: (context: PageEvent) => unknown,
  options: Parameters<typeof createBaseHandler>[1] = {}
) {
  return createBaseHandler(fn, { ...options, createPageEvent });
}