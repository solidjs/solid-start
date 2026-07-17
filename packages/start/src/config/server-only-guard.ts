import type { Plugin } from "vite";

const SERVER_ONLY_MODULES = new Set([
  "@solidjs/start/http",
  "@solidjs/start/middleware",
  "@solidjs/start/config",
]);

/**
 * Fails resolution when a client-reachable module imports one of
 * `@solidjs/start`'s server-only entry points.
 *
 * Without this the import chain silently ends up in the client bundle, where
 * server-only code throws during module evaluation, killing hydration before
 * the router attaches its handlers — forms then fall back to a native POST to
 * the placeholder `action` URL and the page dies with no diagnostic pointing
 * at the actual mistake (https://github.com/solidjs/solid-start/issues/2068).
 */
export function serverOnlyGuard(): Plugin {
  return {
    name: "solid-start:server-only-guard",
    enforce: "pre",
    resolveId(id, importer, { ssr }) {
      if (!ssr && SERVER_ONLY_MODULES.has(id)) {
        this.error(
          `"${id}" is server-only, but it is imported by "${importer ?? "unknown"}", ` +
            `which is included in the client bundle. Code that uses it must run only on ` +
            `the server: mark the function or module that uses it with "use server", or ` +
            `move it into a module that is only imported by server code. ` +
            `(https://github.com/solidjs/solid-start/issues/2068)`,
        );
      }
    },
  };
}
