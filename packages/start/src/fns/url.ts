// Server function requests are sent to `<base>_server/<id>` rather than a bare
// `<base>_server`, so access logs, traces and devtools can tell individual
// functions apart by URL instead of collapsing every call into one entry.
// In development (and in production with `serverFunctions.readableIds`) the id
// ends with the function's source name, which makes the path self-describing.
const SEGMENT = "_server";
const PREFIX = `/${SEGMENT}/`;

export const SERVER_FN_BASE = `/${SEGMENT}`;

/** Builds the request URL for a server function, respecting `BASE_URL`. */
export function serverFunctionURL(id: string) {
  let baseURL = import.meta.env.BASE_URL ?? "/";
  if (!baseURL.endsWith("/")) baseURL += "/";
  return `${baseURL}${SEGMENT}/${encodeURIComponent(id)}`;
}

/** True for `/_server` and `/_server/<id>`, false for e.g. `/_serverless`. */
export function isServerFunctionPath(pathname: string) {
  return pathname === SERVER_FN_BASE || pathname.startsWith(PREFIX);
}

/**
 * Reads the function id out of a request path. Matches on the last `/_server/`
 * so a deployment `base` in front of it does not need to be stripped first.
 */
export function getFunctionIdFromPath(pathname: string): string | null {
  const index = pathname.lastIndexOf(PREFIX);
  if (index === -1) return null;
  const id = pathname.slice(index + PREFIX.length);
  if (!id) return null;
  try {
    return decodeURIComponent(id);
  } catch {
    // malformed percent-encoding
    return null;
  }
}
