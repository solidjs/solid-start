// Client half of the runtime ABI: the fetch transport from
// @solidjs/web/server-functions, configured for Start's BASE_URL-prefixed
// endpoint. Compiled client output (via vite-plugin-solid's serverFunctions
// transform) imports createServerReference from here. Integrations (e.g.
// @solidjs/router) decode pass-through responses themselves with the core
// `decodeResponse`.
import { type Component } from "solid-js";
import {
  configureServerFunctionsClient,
  INSTANCE_HEADER,
} from "@solidjs/web/server-functions/client";
import serovalPlugins from "solid-start:seroval-plugins";
import { pushRequest, pushResponse } from "../shared/dev-toolbar/functions/tracker.ts";

let baseURL = import.meta.env.BASE_URL ?? "/";
if (!baseURL.endsWith("/")) baseURL += "/";

const endpoint = `${baseURL}_server`;

configureServerFunctionsClient({
  endpoint,
  // App-supplied Seroval plugins (`serialization.plugins`) — must match the
  // server handler's codec.
  codec: { plugins: serovalPlugins },
  // Feed the dev toolbar's server-function inspector. The transport stamps a
  // unique instance header on every call; Start's dev server handler echoes
  // it on the response, which is what pairs the two here.
  ...(import.meta.env.DEV
    ? {
        prepareRequest(init: RequestInit, context: { id: string }) {
          const instance = new Headers(init.headers).get(INSTANCE_HEADER);
          if (instance) {
            // GET references carry their args in the query string, which the
            // hook doesn't see, so the URL is the bare endpoint.
            pushRequest(context.id, instance, new Request(endpoint, init));
          }
          return init;
        },
        responseHandler: {
          handle(response: Response, ctx: { id: string }) {
            const instance = response.headers.get(INSTANCE_HEADER);
            if (instance) {
              pushResponse(ctx.id, instance, response.clone());
            }
            // undefined lets the transport decode the response as usual
            return undefined;
          },
        },
      }
    : {}),
});

export {
  createServerReference,
  registerServerReference,
} from "@solidjs/web/server-functions/client";

export function createClientReference(Component: Component<any>, id: string) {
  return Component;
}
