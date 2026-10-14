import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withRouteChunkReload } from "./route-chunk-reload";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value)
  };
}

const failingLoad = () =>
  Promise.reject(new TypeError("Failed to fetch dynamically imported module"));

describe("withRouteChunkReload", () => {
  let location: { href: string; reload: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    location = { href: "http://localhost/", reload: vi.fn() };
    vi.stubGlobal("location", location);
    vi.stubGlobal("sessionStorage", createStorage());
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns the module when the import succeeds", async () => {
    const module = { default: () => null };

    expect(await withRouteChunkReload(() => Promise.resolve(module))()).toBe(module);
    await vi.runAllTimersAsync();
    expect(location.reload).not.toHaveBeenCalled();
  });

  it("resolves with an empty component and reloads once the router reaches the destination", async () => {
    const module = (await withRouteChunkReload(failingLoad)()) as { default: () => unknown };
    expect(module.default()).toBeNull();

    // The router has not finished the navigation yet.
    await vi.advanceTimersByTimeAsync(100);
    expect(location.reload).not.toHaveBeenCalled();

    // It finishes, so the URL is the destination.
    location.href = "http://localhost/about";
    await vi.advanceTimersByTimeAsync(50);
    expect(location.reload).toHaveBeenCalledTimes(1);
  });

  it("reloads after the timeout when the URL does not change", async () => {
    await withRouteChunkReload(failingLoad)();

    await vi.advanceTimersByTimeAsync(900);
    expect(location.reload).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(location.reload).toHaveBeenCalledTimes(1);
  });

  it("rethrows a second failure shortly after a reload instead of reloading again", async () => {
    const load = withRouteChunkReload(failingLoad);

    await load();
    await expect(load()).rejects.toThrow("Failed to fetch dynamically imported module");
    await vi.runAllTimersAsync();
    expect(location.reload).toHaveBeenCalledTimes(1);
  });

  it("reloads again once the earlier reload is long enough ago", async () => {
    const load = withRouteChunkReload(failingLoad);

    await load();
    await vi.runAllTimersAsync();
    vi.setSystemTime(Date.now() + 60_000);
    await load();
    await vi.runAllTimersAsync();

    expect(location.reload).toHaveBeenCalledTimes(2);
  });

  it("rethrows without reloading when sessionStorage is unavailable", async () => {
    vi.stubGlobal("sessionStorage", {
      getItem() {
        throw new Error("SecurityError");
      },
      setItem() {
        throw new Error("SecurityError");
      }
    });

    await expect(withRouteChunkReload(failingLoad)()).rejects.toThrow();
    await vi.runAllTimersAsync();
    expect(location.reload).not.toHaveBeenCalled();
  });
});
