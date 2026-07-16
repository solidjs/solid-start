// Server half of the runtime ABI: the core runtime from
// @solidjs/web/server-functions, configured for Start's policies. Compiled
// server output (via vite-plugin-solid's serverFunctions transform) imports
// registerServerReference / createServerReference from here.
import { provideRequestEvent } from "@solidjs/web/storage";
import { configureServerFunctionsServer } from "@solidjs/web/server-functions/server";
import type { FetchEvent } from "../server/types.ts";

let baseURL = import.meta.env.BASE_URL ?? "/";
if (!baseURL.endsWith("/")) baseURL += "/";

configureServerFunctionsServer({
  // Explicit rather than relying on the runtime's global fallback — SSR
  // in-process calls and the HTTP handler both scope events through this.
  // (Events here are always Start's rich FetchEvents; the runtime types only
  // know the lean core shape.)
  provideEvent: (event, fn) => provideRequestEvent(event as FetchEvent, fn),
  // Reference `url`s (form actions) must respect the app's base path.
  endpoint: `${baseURL}_server`,
});

export { registerServerReference, createServerReference } from "@solidjs/web/server-functions/server";
