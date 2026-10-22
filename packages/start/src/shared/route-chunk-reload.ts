const STORAGE_KEY = "solid-start:route-chunk-reload";

/** A failure within this time of the last reload is not reloaded again. */
const RELOAD_WINDOW_MS = 10_000;

/** How long to wait for the router to move to the destination URL. */
const NAVIGATION_TIMEOUT_MS = 1_000;

/**
 * Wraps the import of a route's component. If the import fails, as it does
 * when a deploy replaced the route's chunk while the page was open, the page
 * reloads once to load the new version.
 *
 * The router only moves to the destination URL once the route has loaded, so
 * the failed import resolves with an empty component instead. The router then
 * finishes the navigation, and the page reloads at the destination.
 *
 * A second failure within `RELOAD_WINDOW_MS` is rethrown, so a chunk that is
 * still missing after the reload shows the normal error instead of reloading
 * in a loop.
 *
 * @see https://github.com/solidjs/solid-start/issues/1644
 */
export function withRouteChunkReload<T>(load: () => Promise<T>): () => Promise<T> {
  return () =>
    load().catch(error => {
      if (!recordReload()) throw error;
      console.warn("[solid-start] A route failed to load, reloading the page.", error);
      reloadAfterNavigation(location.href);
      return { default: () => null } as T;
    });
}

/** Reloads once the URL has changed from `from`, or after `NAVIGATION_TIMEOUT_MS`. */
function reloadAfterNavigation(from: string): void {
  const start = Date.now();
  const check = () => {
    if (location.href !== from || Date.now() - start >= NAVIGATION_TIMEOUT_MS) {
      location.reload();
    } else {
      setTimeout(check, 20);
    }
  };
  setTimeout(check, 0);
}

/**
 * Records a reload. Returns false when one already happened within
 * `RELOAD_WINDOW_MS`, or when it cannot be recorded.
 */
export function recordReload(): boolean {
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(STORAGE_KEY));
    if (last && now - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(STORAGE_KEY, String(now));
    return true;
  } catch {
    // Without storage, a repeated failure looks like a first one, which could
    // reload forever.
    return false;
  }
}
