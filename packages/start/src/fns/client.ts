// Client half of the runtime ABI: the fetch transport from
// @solidjs/web/server-functions, configured for Start's BASE_URL-prefixed
// endpoint. Compiled client output (via vite-plugin-solid's serverFunctions
// transform) imports createServerReference from here. Integrations (e.g.
// @solidjs/router) decode pass-through responses themselves with the core
// `decodeResponse`.
import {
  configureServerFunctionsClient,
  INSTANCE_HEADER,
} from "@solidjs/web/server-functions/client";
import { serializeJSON } from "@solidjs/web/serialization";
import serovalPlugins from "solid-start:seroval-plugins";
import { pushRequest, pushResponse } from "../shared/dev-toolbar/functions/tracker.ts";

let baseURL = import.meta.env.BASE_URL ?? "/";
if (!baseURL.endsWith("/")) baseURL += "/";

const endpoint = `${baseURL}_server`;

// The `;0x{8-hex-byte-length};` chunk framing of the server-function wire
// format (what the transport's ChunkReader on the other end reads).
function frameChunk(data: string): string {
  const bytes = new TextEncoder().encode(data).length;
  const hex = bytes.toString(16);
  return `;0x${"00000000".slice(0, 8 - hex.length)}${hex};${data}`;
}

// Codec encoding for argument lists JSON can't carry faithfully — a `.with()`
// bound value next to FormData (router form actions), Dates, Maps, ... The
// output is the `BodyFormat.Serialized` encoding the server handler already
// decodes; this stands in for @solidjs/web's `enableRichArguments()` until a
// release ships the rich-args entry.
function serializeArgs(args: unknown[]): Promise<string> {
  return new Promise((resolve, reject) => {
    let out = "";
    serializeJSON(args, {
      plugins: serovalPlugins,
      onParse(node) {
        out += frameChunk(JSON.stringify(node));
      },
      onDone() {
        resolve(out);
      },
      onError(error) {
        reject(error);
      },
    });
  });
}

configureServerFunctionsClient({
  endpoint,
  // App-supplied Seroval plugins (`serialization.plugins`) — must match the
  // server handler's codec.
  codec: { plugins: serovalPlugins },
  serializeArgs,
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
