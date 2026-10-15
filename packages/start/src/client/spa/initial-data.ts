import { sharedConfig } from "solid-js";

/**
 * With `ssr: "data-only"`, the HTML shell streams the query results of the
 * requested page into `_$HY.r`, which is where hydration keeps serialized
 * data. The router's `query` already reads that through `sharedConfig.has` and
 * `sharedConfig.load` on a cache miss, but those are only set while
 * hydrating. Set them for the first render so the queries take the streamed
 * results instead of fetching them again.
 *
 * Returns a function that puts `sharedConfig` back once the first render has
 * made its queries.
 */
export function seedInitialData(): (() => void) | undefined {
  const records = (globalThis as { _$HY?: { r?: Record<string, unknown> } })._$HY?.r;
  if (!records) return;

  const { has, load } = sharedConfig;
  sharedConfig.has = key => key in records;
  sharedConfig.load = key => records[key];
  return () => {
    sharedConfig.has = has;
    sharedConfig.load = load;
  };
}
