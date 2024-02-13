// @ts-ignore
import App from "#start/app";
import { ErrorBoundary } from "../shared/ErrorBoundary";
import "./mount";

export function StartClient() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
