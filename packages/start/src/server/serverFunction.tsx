import { getRequestEvent } from "solid-js/web";
import type { ServerFunctionMeta } from "./types";

export function getServerFunctionMeta(): ServerFunctionMeta | undefined {
  return getRequestEvent()?.locals.serverFunctionMeta;
}
