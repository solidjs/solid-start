import { ErrorBoundary as DefaultErrorBoundary, type ParentProps } from "solid-js";
import { HttpStatusCode } from "./HttpStatusCode";
import { DevOverlay } from "./dev-overlay";

export function ErrorBoundary(props: ParentProps) {
  if (import.meta.env.DEV) {
    return <DevOverlay>{props.children}</DevOverlay>;
  }
  return (
    <DefaultErrorBoundary fallback={<HttpStatusCode code={500} />}>
      {props.children}
    </DefaultErrorBoundary>
  );
}
