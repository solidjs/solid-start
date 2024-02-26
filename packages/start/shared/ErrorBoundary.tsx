import { ErrorBoundary as DefaultErrorBoundary, type ParentProps } from "solid-js";
import { isServer } from "solid-js/web";
import { HttpStatusCode } from "./HttpStatusCode";
import { DevOverlay } from "./dev-overlay";

export function ErrorBoundary(props: ParentProps) {
  if (import.meta.env.DEV && import.meta.env.START_DEV_OVERLAY) {
    return <DevOverlay>{props.children}</DevOverlay>;
  }
  const message = isServer ? "500 | Internal Server Error" : "Error | Uncaught Client Exception";
  return (
    <DefaultErrorBoundary
      fallback={
        <>
          <span style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">{message}</span>
          <HttpStatusCode code={500} />
        </>
      }
    >
      {props.children}
    </DefaultErrorBoundary>
  );
}
