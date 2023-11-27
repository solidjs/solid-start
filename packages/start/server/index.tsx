export { StartServer } from "./StartServer";
export * from "./middleware";
export type { DocumentComponentProps } from "./types";
import { createPageEvent } from "./page-event";
import { createHandler as createBaseHandler } from "./handler";
import type { PageEvent } from "./types";

export function createHandler(
  fn: (context: PageEvent) => unknown,
  options: Parameters<typeof createBaseHandler>[1] = {}
) {
  return createBaseHandler(fn, { ...options, createPageEvent });
}
