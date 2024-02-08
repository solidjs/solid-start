import { createAsync } from "@solidjs/router";
import { createMemo } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";

export function createAsyncStore<T extends object>(source: () => Promise<T>) {
  const resource = createAsync(source)
  return createMemo((prev) => {
    const next = resource();
    if (prev) reconcile(next)(unwrap(prev));
    else {
      const [store] = createStore(next);
      prev = store;
    };
    return prev as T;
  })
}