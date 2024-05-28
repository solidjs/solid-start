import { getRequestEvent } from "solid-js/web";
import type { ServerFunctionMeta } from "./types";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/get-server-function-meta
 */
export function getServerFunctionMeta(): ServerFunctionMeta | undefined {
  return getRequestEvent()?.locals.serverFunctionMeta;
}
