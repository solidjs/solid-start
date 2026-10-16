import { sharedConfig } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { seedInitialData } from "./initial-data.ts";

describe("seedInitialData", () => {
  afterEach(() => {
    delete (globalThis as any)._$HY;
  });

  it("does nothing without streamed data", () => {
    expect(seedInitialData()).toBeUndefined();
    expect(sharedConfig.has).toBeUndefined();
  });

  it("lets the first render read the streamed data, then puts sharedConfig back", () => {
    const value = Promise.resolve({ id: 1 });
    (globalThis as any)._$HY = { r: { 'user["1"]': value } };

    const restore = seedInitialData()!;
    expect(sharedConfig.has!('user["1"]')).toBe(true);
    expect(sharedConfig.has!("other[]")).toBe(false);
    expect(sharedConfig.load!('user["1"]')).toBe(value);

    restore();
    expect(sharedConfig.has).toBeUndefined();
    expect(sharedConfig.load).toBeUndefined();
  });
});
