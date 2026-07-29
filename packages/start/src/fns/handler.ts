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
  handleServerFunctionRequest
} from "@solidjs/web/server-functions/server";
import { createFlightDataCollector } from "@solidjs/router/server";
import "solid-start:server-fn-manifest";

import { getFetchEvent } from "../server/fetchEvent.ts";
import { fileRoutes } from "../router.tsx";
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
