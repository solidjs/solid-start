import { createRoutes } from "../shared/FileRoutes";
import { apiRoutes } from "../shared/routes";
import { composeMiddleware } from "./fetch-event";
import { renderStream } from "./render";
import { FETCH_EVENT, FetchEvent, PageEvent } from "./types";

function api() {
  return ({ forward }) => {
    return async event => {
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
      return forward(event);
    };
  };
}

export function render(
  fn: (context: PageEvent) => unknown,
  options?: { nonce?: string; renderId?: string; timeoutMs?: number }
) {
  return composeMiddleware([api(), renderStream(fn, { ...options, createPageEvent })]);
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
