// HTTP dispatch for server functions: the core web-standard handler from
// @solidjs/web/server-functions, with Start's policies layered on through
// its hooks — the h3-derived rich event, single-flight payload collection
// (a data-only page render folded into the response), and the no-JS
// flash-cookie form convention.
import { parseSetCookie } from "cookie-es";
import { type H3Event, parseCookies } from "h3";
import { sharedConfig } from "solid-js";
import { isResponseEnvelope, renderToString, ResponseEnvelope } from "@solidjs/web";
import { provideRequestEvent } from "@solidjs/web/storage";
import { handleServerFunctionRequest } from "@solidjs/web/server-functions/server";
import "solid-start:server-fn-manifest";

import { getFetchEvent } from "../server/fetchEvent.ts";
import { createPageEvent } from "../server/handler.ts";
import type { FetchEvent, PageEvent } from "../server/types.ts";
import { getExpectedRedirectStatus } from "../server/util.ts";

export async function handleServerFunction(h3Event: H3Event): Promise<Response> {
  const event = getFetchEvent(h3Event);

  return handleServerFunctionRequest(event.request, {
    createEvent: () => event,
    provideEvent(evt, fn) {
      return provideRequestEvent(evt as FetchEvent, () => {
        /* @ts-expect-error */
        sharedConfig.context = { event: evt };
        return fn();
      });
    },
    // Single-flight: fold the revalidated route data into the response so
    // the router applies the mutation and the fresh data in one round trip.
    // Runs for returned and thrown results alike (thrown redirects carry
    // flight data too).
    async transformResult(evt, result, context) {
      if (context.instance && evt.request.headers.has("X-Single-Flight")) {
        return handleSingleFlight(evt as FetchEvent, result);
      }
      return result;
    },
    handleNoJS,
  });
}

/**
 * No-JS form posts: redirect back (or to the result's Location) carrying the
 * result in a flash cookie the next page render picks up.
 */
function handleNoJS(result: any, request: Request, parsed: any[], thrown?: boolean) {
  const url = new URL(request.url);
  const isError = result instanceof Error;
  let statusCode = 302;
  let headers: Headers;
  if (result instanceof Response) {
    headers = new Headers(result.headers);
    if (result.headers.has("Location")) {
      headers.set(
        `Location`,
        new URL(result.headers.get("Location")!, url.origin + import.meta.env.BASE_URL).toString(),
      );
      statusCode = getExpectedRedirectStatus(result);
    }
  } else
    headers = new Headers({
      Location: new URL(request.headers.get("referer")!).toString(),
    });
  if (result) {
    headers.append(
      "Set-Cookie",
      `flash=${encodeURIComponent(
        JSON.stringify({
          url: url.pathname + url.search,
          result: isError ? result.message : result,
          thrown: thrown,
          error: isError,
          input: [...parsed.slice(0, -1), [...parsed[parsed.length - 1].entries()]],
        }),
      )}; Secure; HttpOnly;`,
    );
  }
  return new Response(null, {
    status: statusCode,
    headers,
  });
}

let App: any;
export function createSingleFlightHeaders(sourceEvent: FetchEvent) {
  // cookie handling logic is pretty simplistic so this might be imperfect
  // unclear if h3 internals are available on all platforms but we need a way to
  // update request headers on the underlying H3 event.

  const headers = new Headers(sourceEvent.request.headers);
  const cookies = parseCookies(sourceEvent.nativeEvent);
  const SetCookies = sourceEvent.response.headers.getSetCookie();
  headers.delete("cookie");
  SetCookies.forEach(cookie => {
    if (!cookie) return;
    const { maxAge, expires, name, value } = parseSetCookie(cookie);
    if (maxAge != null && maxAge <= 0) {
      delete cookies[name];
      return;
    }
    if (expires != null && expires.getTime() <= Date.now()) {
      delete cookies[name];
      return;
    }
    cookies[name] = value;
  });
  Object.entries(cookies).forEach(([key, value]) => {
    headers.append("cookie", `${key}=${value}`);
  });

  return headers;
}

/**
 * Renders the app data-only against the destination URL (the referer, or the
 * result's redirect target) to collect the route data the mutation
 * invalidated, and returns it as a `ResponseEnvelope`: the original result's
 * HTTP metadata plus the flight payload, with the original value folded in
 * under `_$value` (where the router reads it back out).
 */
async function handleSingleFlight(sourceEvent: FetchEvent, result: any): Promise<any> {
  let revalidate: string[] | undefined;
  let url = new URL(sourceEvent.request.headers.get("referer")!).toString();

  // The result's HTTP shape: respond() envelopes carry both metadata and a
  // value; raw Responses (redirect/reload) carry metadata only.
  let response: Response | undefined;
  let value = result;
  if (isResponseEnvelope(result)) {
    response = result.response;
    value = result.value;
  } else if (result instanceof Response) {
    response = result;
    value = undefined;
  }
  if (response) {
    if (response.headers.has("X-Revalidate"))
      revalidate = response.headers.get("X-Revalidate")!.split(",");
    if (response.headers.has("Location"))
      url = new URL(
        response.headers.get("Location")!,
        new URL(sourceEvent.request.url).origin + import.meta.env.BASE_URL,
      ).toString();
  }

  const event = { ...sourceEvent } as PageEvent;
  event.request = new Request(url, {
    headers: createSingleFlightHeaders(sourceEvent),
  });
  return await provideRequestEvent(event, async () => {
    await createPageEvent(event);
    App || (App = (await import("solid-start:app")).default);
    /* @ts-expect-error */
    event.router.dataOnly = revalidate || true;
    /* @ts-expect-error */
    event.router.previousUrl = sourceEvent.request.headers.get("referer");
    try {
      // The tree must be returned, not just invoked: rendering is lazy and a
      // discarded App() never executes the routes (the Solid 1.x version of
      // this code called it purely for side effects).
      renderToString(() => {
        /* @ts-expect-error */
        sharedConfig.context.event = event;
        return App();
      });
    } catch (e) {
      console.log(e);
    }

    /* @ts-expect-error */
    const body = event.router.data;
    if (!body) return result;
    let containsKey = false;
    for (const key in body) {
      if (body[key] === undefined) delete body[key];
      else containsKey = true;
    }
    if (!containsKey) return result;

    body["_$value"] = value;
    const headers = new Headers(response?.headers);
    headers.set("X-Single-Flight", "true");
    return new ResponseEnvelope(
      new Response(null, { status: response?.status ?? 200, headers }),
      body,
    );
  });
}
