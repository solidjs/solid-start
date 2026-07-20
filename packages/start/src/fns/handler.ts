// HTTP dispatch for server functions: the core web-standard handler from
// @solidjs/web/server-functions with Start's platform piece (the h3-derived
// rich event). The framework policies that used to live here — single-flight
// payload collection and the no-JS flash-cookie form convention — are the
// router's now (@solidjs/router/server owns their vocabulary: query cache
// keys, submissions); Start just wires its route tree and base path in.
import { type H3Event } from "h3";
import { sharedConfig } from "solid-js";
import { provideRequestEvent } from "@solidjs/web/storage";
import { handleServerFunctionRequest } from "@solidjs/web/server-functions/server";
import { createFlightDataCollector, createNoJSHandler } from "@solidjs/router/server";
import "solid-start:server-fn-manifest";

import { getFetchEvent } from "../server/fetchEvent.ts";
import { createRoutes } from "../router.tsx";
import type { FetchEvent } from "../server/types.ts";

let base = import.meta.env.BASE_URL ?? "/";
if (base.endsWith("/")) base = base.slice(0, -1);

// Single-flight: the router's preload runner produces the revalidated route
// data for the post-mutation URL straight off the file-system route tree —
// no app render involved.
const collectFlightData = createFlightDataCollector({ routes: createRoutes, base });

// No-JS form posts redirect back (303) with the outcome in the router's
// flash cookie; the router seeds submission state from it on the next SSR.
const handleNoJS = createNoJSHandler({ base });

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
    collectFlightData,
    handleNoJS,
  });
}
