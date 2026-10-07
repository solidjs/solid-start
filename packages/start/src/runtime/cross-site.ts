/**
 * Server functions are same-origin RPC: a page on another site must not be
 * able to invoke one with the visitor's cookies. Trust `Sec-Fetch-Site` when
 * the browser sends it, and fall back to comparing `Origin` against the
 * request host.
 *
 * `same-origin` and `same-site` are allowed, matching the reach of a
 * `SameSite=Lax`/`Strict` cookie. `none` is a user-initiated navigation
 * (typed URL, bookmark), not a request issued by another site.
 */
export function isCrossSiteRequest(request: Request, url: URL): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite) {
    return secFetchSite === "cross-site";
  }
  // Older browsers omit Sec-Fetch-Site. They still send Origin on the
  // cross-site requests that matter (form and fetch POSTs), so compare it.
  const origin = request.headers.get("origin");
  // `null` is an opaque origin (a sandboxed iframe, a cross-origin redirect
  // chain): the browser declines to name the caller, so it cannot be matched.
  if (origin === "null") {
    return true;
  }
  if (origin) {
    try {
      return new URL(origin).host !== url.host;
    } catch {
      return true;
    }
  }
  // No Origin either (a same-origin GET, or a non-browser client): nothing to
  // reject on.
  return false;
}
