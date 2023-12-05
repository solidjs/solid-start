export { StartServer } from "./StartServer";
export * from "./middleware";
export * from "./types";
import { createHandler as createBaseHandler } from "./handler";
import { createPageEvent } from "./page-event";
import type { PageEvent } from "./types";

export function createHandler(
  fn: (context: PageEvent) => unknown,
  options: Parameters<typeof createBaseHandler>[1] = {}
) {
  return createBaseHandler(fn, { ...options, createPageEvent });
}
