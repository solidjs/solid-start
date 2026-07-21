// Client half of the runtime ABI: the fetch transport from
// @solidjs/web/server-functions, configured for Start's BASE_URL-prefixed
// endpoint. Compiled client output (via vite-plugin-solid's serverFunctions
// transform) imports createServerReference from here. Integrations (e.g.
// @solidjs/router) decode pass-through responses themselves with the core
// `decodeResponse`.
import { type Component } from "solid-js";
import { configureServerFunctionsClient } from "@solidjs/web/server-functions/client";

let baseURL = import.meta.env.BASE_URL ?? "/";
if (!baseURL.endsWith("/")) baseURL += "/";

configureServerFunctionsClient({ endpoint: `${baseURL}_server` });

export {
  createServerReference,
  registerServerReference,
} from "@solidjs/web/server-functions/client";

export function createClientReference(Component: Component<any>, id: string) {
  return Component;
}
