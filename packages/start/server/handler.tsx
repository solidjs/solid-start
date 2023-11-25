import { renderToStream } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";
import { eventHandler, EventHandlerObject, EventHandlerRequest, H3Event } from "vinxi/server";
import { createRoutes } from "../shared/FileRoutes";
import { apiRoutes } from "../shared/routes";
import { getFetchEvent } from "./middleware";
import { FETCH_EVENT, FetchEvent, PageEvent } from "./types";

export function createHandler(
  fn: (context: PageEvent) => unknown,
  options: {
    nonce?: string;
    renderId?: string;
    timeoutMs?: number;
    onCompleteAll?: (options: { write: (v: any) => void }) => void;
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
        const match = apiRoutes.find(
          route =>
            route[`$${event.request.method}`] && new URL(event.request.url).pathname === route.path
        );
        if (match) {
          const mod = await match[`$${event.request.method}`].import();
          const fn = mod[event.request.method];
          const result = await fn(event);
          return result;
        }

        // render stream
        const context = await createPageEvent(event);
        let cloned = { ...options };
        if (cloned.onCompleteAll) {
          const og =  cloned.onCompleteAll;
          cloned.onCompleteAll = options => {
            handleStreamingRedirect(context)(options);
            og(options);
          };
        } else cloned.onCompleteAll = handleStreamingRedirect(context);
        const stream = renderToStream(() => fn(context), cloned);
        if (context.response && context.response.headers.get("Location")) {
          return event.redirect(context.response.headers.get("Location"));
        }
        return { pipeTo: stream.pipeTo };
      });
    }
  });
}

function handleStreamingRedirect(context: PageEvent) {
  return ({ write }: { write: (html: string) => void }) => {
    const to = context.response && context.response.headers.get("Location");
    to && write(`<script>window.location="${to}"</script>`);
  };
}

export async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"];
  const serverManifest = import.meta.env.MANIFEST["ssr"];
  const prevPath = ctx.request.headers.get("x-solid-referrer");
  const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
  ctx.setResponseHeader("Content-Type", "text/html");
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: await clientManifest.json(),
    assets: [
      ...(await clientManifest.inputs[clientManifest.handler].assets()),
      ...(import.meta.env.START_ISLANDS
        ? await serverManifest.inputs[serverManifest.handler].assets()
        : [])
    ],
    routes: createRoutes(),
    prevUrl: prevPath || "",
    mutation: mutation,
    $type: FETCH_EVENT,
    $islands: new Set<string>()
  });

  return pageEvent;
}
