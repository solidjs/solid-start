import { renderToStream } from "solid-js/web";
import {
  eventHandler,
  EventHandlerObject,
  EventHandlerRequest,
  H3Event
} from "vinxi/runtime/server";
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
    createPageEvent?: (event: FetchEvent) => Promise<PageEvent>;
    onRequest?: EventHandlerObject["onRequest"];
    onBeforeResponse?: EventHandlerObject["onBeforeResponse"];
  } = {}
) {
  return eventHandler({
    onRequest: options.onRequest,
    onBeforeResponse: options.onBeforeResponse,
    handler: async (e: H3Event<EventHandlerRequest> & { startEvent: FetchEvent }) => {
      const event = getFetchEvent(e);
      event.locals.start = "start";
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
      const stream = renderToStream(() => fn(context), options);
      if (context.routerContext && context.routerContext.url) {
        return event.redirect(context.routerContext.url);
      }
      return { pipeTo: stream.pipeTo };
    }
  });
}

export async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"];
  const serverManifest = import.meta.env.MANIFEST["ssr"];
  const prevPath = ctx.request.headers.get("x-solid-referrer");
  const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
  const pageEvent: PageEvent = {
    ...ctx,
    manifest: await clientManifest.json(),
    assets: [
      ...(await clientManifest.inputs[clientManifest.handler].assets()),
      ...(import.meta.env.START_ISLANDS
        ? await serverManifest.inputs[serverManifest.handler].assets()
        : [])
    ],
    routes: createRoutes(),
    prevUrl: prevPath || "",
    routerContext: {} as any,
    mutation: mutation,
    tags: [],
    $type: FETCH_EVENT,
    $islands: new Set<string>()
  };

  return pageEvent;
}
