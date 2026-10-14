import type { Plugin } from "vite";

const EMPTY_ID = "\0solid-start:boundary-modules:empty";

/**
 * Supports the `server-only` and `client-only` marker modules (#2162).
 *
 * `server-only` imported from a client module fails the build at resolve time.
 * A client module that reaches server-only code is always a mistake and must
 * never bundle. Start's own server-only entry points (`@solidjs/start/http`,
 * `@solidjs/start/middleware`) import `server-only` themselves, so pulling them
 * into the client bundle fails loudly instead of shipping server code to the
 * browser (https://github.com/solidjs/solid-start/issues/2068).
 *
 * `client-only` cannot be enforced the same way. The server build resolves
 * every dynamic import to emit its chunk, so a module reached only through
 * `clientOnly(() => import(...))` is resolved by the server build even though
 * it never runs on the server. Failing the build there is a false positive
 * that breaks the client-only lazy pattern, so `client-only` resolves to an
 * empty module in both environments. Client-only code that does reach the
 * server runtime still fails there on its own (e.g. a missing `window`).
 */
export function boundaryModules(): Plugin {
  return {
    name: "solid-start:boundary-modules",
    enforce: "pre",
    resolveId(id, importer, { ssr }) {
      if (id === "server-only") {
        if (!ssr) {
          this.error(
            `Attempt to import 'server-only' in a client module: ${importer}. ` +
              `Code that uses this module must run only on the server: mark it with ` +
              `"use server", or make sure it is only imported by server code.`,
          );
        }
        return EMPTY_ID;
      }
      if (id === "client-only") {
        return EMPTY_ID;
      }
      return null;
    },
    load(id) {
      if (id === EMPTY_ID) {
        return "export {}";
      }
    },
  };
}
