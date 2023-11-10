import {
  createEffect,
  ErrorBoundary as ErrorBoundaryBase,
  JSX,
  ParentProps,
  resetErrorBoundaries,
  Show
} from "solid-js";

export function ErrorBoundary(
  props: ParentProps<{ fallback?: (e: any, reset: () => void) => JSX.Element }>
) {
  return (
    <ErrorBoundaryBase
      fallback={(e, reset) => {
        return (
          <Show when={!props.fallback} fallback={props.fallback && props.fallback(e, reset)}>
            <ErrorMessage error={e} />
          </Show>
        );
      }}
    >
      {props.children}
    </ErrorBoundaryBase>
  );
}

export function ErrorMessage(props: { error: any }) {
  createEffect(() => console.error(props.error));

  console.log(props.error);
  return (
    <div style={{ padding: "16px" }}>
      <div
        style={{
          "background-color": "rgba(252, 165, 165)",
          color: "rgb(153, 27, 27)",
          "border-radius": "5px",
          overflow: "scroll",
          padding: "16px",
          "margin-bottom": "8px"
        }}
      >
        <p style={{ "font-weight": "bold" }} id="error-message">
          {props.error.message}
        </p>
        <button
          id="reset-errors"
          onClick={resetErrorBoundaries}
          style={{
            color: "rgba(252, 165, 165)",
            "background-color": "rgb(153, 27, 27)",
            "border-radius": "5px",
            padding: "4px 8px"
          }}
        >
          Clear errors and retry
        </button>
        <pre style={{ "margin-top": "8px", width: "100%" }}>{props.error.stack}</pre>
      </div>
    </div>
  );
}
