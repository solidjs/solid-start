import { renderToStream } from "solid-js/web";
import { eventHandler, EventHandlerRequest, H3Event } from "vinxi/runtime/server";
import { createRoutes } from "../shared/FileRoutes";
import { apiRoutes } from "../shared/routes";
import { createFetchEvent } from "./middleware";
import { FetchEvent, FETCH_EVENT, PageEvent } from "./types";

export function createHandler(
  fn: (context: PageEvent) => unknown,
  options?: { nonce?: string; renderId?: string; timeoutMs?: number, createPageEvent: (event: FetchEvent) => Promise<PageEvent>; }
) {
  return eventHandler(async (e: H3Event<EventHandlerRequest>) => {
    const event = createFetchEvent(e);
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
