import { getRequestEvent } from "solid-js/web";
import type { ServerFunctionMeta } from "../server/types";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/get-server-function-meta
 */
export function getServerFunctionMeta(): ServerFunctionMeta | undefined {
  return getRequestEvent()?.locals.serverFunctionMeta;
}
