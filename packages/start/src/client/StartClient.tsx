// @refresh skip
import App from "solid-start:app";
import { ErrorBoundary } from "../shared/ErrorBoundary.tsx";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/client/start-client
 */
export function StartClient() {
  // The server wraps the app in: NoHydration → TopErrorBoundary → Hydration → ErrorBoundary → App
  // TopErrorBoundary lives outside the Hydration zone (inside NoHydration), so it doesn't
  // contribute to hydration keys. The client only needs to mirror what's inside the
  // server's Hydration boundary: ErrorBoundary → App.
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export function StartClientTanstack() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
