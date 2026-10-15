import { sharedConfig } from "solid-js";
import { getRequestEvent, renderToString } from "solid-js/web";

import { createRoutes } from "../../router.tsx";
import type { PageEvent } from "../types.ts";

const BODY_HEADERS = new Set(["content-type", "content-length", "content-encoding"]);
const initialData = new WeakMap<PageEvent, [key: string, value: Promise<unknown>][]>();
let App: typeof import("solid-start:app").default | undefined;

/**
 * Runs the route `preload`s for the requested page and keeps the promises of
 * their queries, so the HTML shell can stream the results to the client.
 *
 * This is the same pass single-flight mutations use: with
 * `event.router.dataOnly` set, the router runs the matched routes' `preload`s
 * without rendering any page, and `query` stores each call in
 * `event.router.data`. In SPA builds the server routes have no page components
 * at all, only their `preload`s.
 */
export async function loadInitialData(event: PageEvent): Promise<void> {
  App ||= (await import("solid-start:app")).default;
  const router = ((event as any).router ||= {});
  event.routes = createRoutes();
  router.dataOnly = true;
  try {
    renderToString(() => {
      (sharedConfig.context as any).event = event;
      return App!({});
    });
  } catch (error) {
    // The root is written for the browser in SPA mode. If it can't render on
    // the server, the client fetches its data as usual.
    console.error(error);
  }
  const data: Record<string, unknown> | undefined = router.data;
  delete router.dataOnly;
  delete router.data;
  if (!data) return;

  const entries: [string, Promise<unknown>][] = [];
  for (const key in data) {
    if (data[key] === undefined) continue;
    const promise = Promise.resolve(data[key]).then(
      value => handleResponse(event, value),
      async error => {
        const value = await handleResponse(event, error);
        // A thrown redirect ends the page, so there is no error to show.
        if (!event.response.headers.has("Location")) throw value;
      },
    );
    // Serialization reads the rejection; until the shell renders, nothing does.
    promise.catch(() => {});
    entries.push([key, promise]);
  }
  initialData.set(event, entries);
}

/**
 * Streams the query results collected by `loadInitialData` into `_$HY.r`,
 * where the router's `query` looks for serialized data. It has to render under
 * `<Hydration>`, because Solid skips serialization inside `<NoHydration>`.
 */
export function InitialData() {
  const context = sharedConfig.context as any;
  // Only a streamed render can send results that settle after the shell.
  if (!context?.async) return null;
  const entries = initialData.get(getRequestEvent() as PageEvent);
  if (entries) {
    for (const [key, value] of entries) context.serialize(key, value);
  }
  return null;
}

/**
 * `query` normally applies a returned `Response` itself, but it skips that in
 * data-only mode. Apply it here the same way: copy its headers to the page
 * response, turn a `Location` into a redirect of the page, and send the body
 * of a `json()` response instead of the response. The body headers describe
 * the query's response, not the page, so they stay behind.
 */
async function handleResponse(event: PageEvent, value: unknown): Promise<unknown> {
  if (!(value instanceof Response)) return value;
  for (const [key, header] of value.headers) {
    if (BODY_HEADERS.has(key)) continue;
    if (key === "set-cookie") event.response.headers.append(key, header);
    else event.response.headers.set(key, header);
  }
  if (value.headers.has("Location")) {
    event.response.status = value.status;
    return undefined;
  }
  const customBody = (value as Response & { customBody?: () => unknown }).customBody;
  return customBody ? await customBody() : value;
}
