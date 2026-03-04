// @refresh skip
import App from "solid-start:app";
import { ErrorBoundary, TopErrorBoundary } from "../shared/ErrorBoundary.tsx";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/client/start-client
 */
export function StartClient() {
  // The server-side StartServer wraps the app in:
  //   <TopErrorBoundary> → <Hydration> → <ErrorBoundary> → <App />
  // TopErrorBoundary uses Errored which creates owners via createErrorBoundary.
  // We must mirror the same owner structure on the client for hydration keys
  // to match. In Solid 2.0 createComponent no longer creates owners, so the
  // old Dummy wrapper approach is insufficient.
  return (
    <TopErrorBoundary>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </TopErrorBoundary>
  );
}

export function StartClientTanstack() {
  return (
    <TopErrorBoundary>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </TopErrorBoundary>
  );
}
