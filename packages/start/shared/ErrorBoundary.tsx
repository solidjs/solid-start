import {
  createEffect,
  ErrorBoundary as ErrorBoundaryBase,
  type ParentProps,
  resetErrorBoundaries
} from "solid-js";

import { HttpStatusCode } from "./HttpStatusCode";

export function ErrorBoundary(props: ParentProps) {
  return (
    <ErrorBoundaryBase fallback={e => <ErrorMessage error={e} />}>
      {props.children}
    </ErrorBoundaryBase>
  );
}

function ErrorMessage(props: { error: any }) {
  createEffect(() => console.error(props.error));

  return (
    <div style="padding:16px">
      <HttpStatusCode code={500} />
      <div
        style={
          "background-color:#fca5a5;" +
          "color:#991b1b;" +
          "border-radius:5px;" +
          "overflow:scroll;" +
          "padding:16px;" +
          "margin-bottom:8px"
        }
      >
        <p style="font-weight:bold" id="error-message">
          {props.error.message}
        </p>
        <button
          id="reset-errors"
          onClick={resetErrorBoundaries}
          style={
            "color:#fca5a5;" +
            "background-color:#991b1b;" +
            "border-radius:5px;" +
            "padding:4px 8px;" +
            "margin-top:8px"
          }
        >
          Clear errors and retry
        </button>
        <pre style="margin-top:8px;width:100%">{props.error.stack}</pre>
      </div>
    </div>
  );
}
