import { getServerFunctionInvocation } from "@solidjs/web/server-functions";
import type { ServerFunctionMeta } from "../server/types.ts";

/**
 * Alias for `getServerFunctionInvocation` from
 * `@solidjs/web/server-functions`, kept for compatibility with Start's
 * historical API. The invocation state lives in core-private per-event
 * state now (no longer on `event.locals`).
 *
 * @deprecated Use `getServerFunctionInvocation` from
 * `@solidjs/web/server-functions` instead.
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/get-server-function-meta
 */
export function getServerFunctionMeta(): ServerFunctionMeta | undefined {
  return getServerFunctionInvocation();
}
