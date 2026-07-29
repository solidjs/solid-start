// HTTP dispatch for server functions: the core web-standard handler from
// @solidjs/web/server-functions with Start's platform piece (the h3-derived
// rich event). Single-flight payload collection is the router's
// (@solidjs/router/server owns its vocabulary: query cache keys,
// submissions); the no-JS flash-cookie form convention is router-agnostic
// and lives in core (@solidjs/web/server-functions/server, as of router
// 2.0.0-next.12). Start just wires its route tree and base path in.
import { type H3Event } from "h3";
import { sharedConfig } from "solid-js";
import { provideRequestEvent } from "@solidjs/web/storage";
import {
  createNoJSHandler,
  handleServerFunctionRequest,
  INSTANCE_HEADER,
} from "@solidjs/web/server-functions/server";
import { createFlightDataCollector } from "@solidjs/router/server";
import "solid-start:server-fn-manifest";
import serovalPlugins from "solid-start:seroval-plugins";

import { getFetchEvent } from "../server/fetchEvent.ts";
import { fileRoutes } from "../router.tsx";
import { applyServerFunctionErrorHandler } from "./error-handler.ts";
import type { FetchEvent } from "../server/types.ts";

let base = import.meta.env.BASE_URL ?? "/";
if (base.endsWith("/")) base = base.slice(0, -1);

// Single-flight: the router's preload runner produces the revalidated route
// data for the post-mutation URL straight off the file-system route tree —
// no app render involved.
const collectFlightData = createFlightDataCollector({ routes: fileRoutes, base });

// No-JS form posts redirect back (303) with the outcome in the router's
// flash cookie; the router seeds submission state from it on the next SSR.
const handleNoJS = createNoJSHandler({ base });

/**
 * Runs the app's configured handler (`serverFunctions.onError`) over whatever a
 * server function threw, before the core serializes it. This sits around the
 * function call rather than on the core's `transformResult` seam because that
 * seam only sees thrown `Response`s and envelopes — a plain `Error`, the case
 * the option exists for, never reaches it.
 */
function applyErrorHandler(thrown: unknown): never {
  throw applyServerFunctionErrorHandler(thrown);
}

export async function handleServerFunction(h3Event: H3Event): Promise<Response> {
  const event = getFetchEvent(h3Event);

  const response = await handleServerFunctionRequest(event.request, {
    createEvent: () => event,
    provideEvent(evt, fn) {
      return provideRequestEvent(evt as FetchEvent, () => {
        /* @ts-expect-error */
        sharedConfig.context = { event: evt };
        // The seam has to stay synchronous (it must return the function's own
        // return value, not a promise of it), so route a rejection through the
        // handler rather than awaiting here.
        try {
          const result = fn();
          return result instanceof Promise
            ? (result.catch(applyErrorHandler) as typeof result)
            : result;
        } catch (thrown) {
          return applyErrorHandler(thrown);
        }
      });
    },
    collectFlightData,
    handleNoJS,
    // App-supplied Seroval plugins (`serialization.plugins`) — must match the
    // client transport's codec.
    codec: { plugins: serovalPlugins },
  });

  if (import.meta.env.DEV) {
    // Echo the transport's per-call instance header so the dev toolbar's
    // inspector can pair this response with the request it captured.
    const instance = event.request.headers.get(INSTANCE_HEADER);
    if (instance) {
      try {
        response.headers.set(INSTANCE_HEADER, instance);
      } catch {
        // some responses (e.g. Response.redirect) have immutable headers
      }
    }
  }

  return response;
}
