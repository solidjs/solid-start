import type { Plugin } from "vite";

const VIRTUAL_ID = "\0solid-start:boundary-modules:id";

/**
 * Supports `server-only` and `client-only` marker modules (#2162): importing
 * `server-only` from a client module (or `client-only` from a server module)
 * fails at resolve time; in the allowed environment the marker resolves to an
 * empty module.
 *
 * Start's own server-only entry points (`@solidjs/start/http`,
 * `@solidjs/start/middleware`) import `server-only` themselves, so pulling
 * them into the client bundle fails loudly instead of shipping server code to
 * the browser, where it crashed hydration and broke unrelated actions/forms
 * with no diagnostic (https://github.com/solidjs/solid-start/issues/2068).
 */
export function boundaryModules(): Plugin {
  return {
    name: "solid-start:boundary-modules",
    enforce: "pre",
    resolveId(id, importer, { ssr }) {
      if (id === "server-only") {
        if (!ssr)
          this.error(
            `Attempt to import 'server-only' in a client module: ${importer}. ` +
              `Code that uses this module must run only on the server: mark it with ` +
              `"use server", or make sure it is only imported by server code.`,
          );
      } else if (id === "client-only") {
        if (ssr)
          this.error(
            `Attempt to import 'client-only' in a server module: ${importer}. ` +
              `Code that uses this module must run only in the browser: make sure it ` +
              `is only imported by client code (e.g. wrap components with clientOnly()).`,
          );
      } else {
        return null;
      }
      return VIRTUAL_ID;
    },
    load(id) {
      if (id === VIRTUAL_ID) return "export {}";
    },
  };
}
