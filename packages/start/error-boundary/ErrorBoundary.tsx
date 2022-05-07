import { useNavigate } from "solid-app-router";
import {
  ErrorBoundary as ErrorBoundaryBase,
  JSX,
  PropsWithChildren,
  resetErrorBoundaries,
  Show,
  startTransition
} from "solid-js";

import { isRedirectResponse, LocationHeader } from "../server/responses";

export function ErrorBoundary(props: PropsWithChildren<{ fallback?: (e: any) => JSX.Element }>) {
  const navigate = useNavigate();

  return (
    <ErrorBoundaryBase
      fallback={e => {
        const response = () => {
          if (e instanceof Response) {
            return e;
          }

          try {
            let response = JSON.parse(e.message, (k, value) => {
              if (!value) {
                return value;
              }
              if (value.$type === "headers") {
                let headers = new Headers();
                value.headers.forEach((value, key) => headers.set(key, value));
                return headers;
              }
              if (value.$type === "request") {
                return new Request(value.url, {
                  method: value.method,
                  headers: value.headers
                });
              }
              return value;
            });
            if (response.$type === "response") {
              return new Response(response.body, {
                status: response.status,
                headers: new Headers(response.headers)
              });
            }
          } catch (e) {}
        };

        return (
          <Show
            when={!isRedirectResponse(response())}
            fallback={() => {
              let res = response();
              let location = res.headers.get(LocationHeader);
              startTransition(() => {
                navigate(location.startsWith("/") ? location : new URL(location).pathname);
                resetErrorBoundaries();
              });

              return null;
            }}
          >
            <Show when={!props.fallback} fallback={props.fallback(e)}>
              <ErrorMessage error={e} />
            </Show>
          </Show>
        );
      }}
    >
      {props.children}
    </ErrorBoundaryBase>
  );
}

function ErrorMessage(props: { error: any }) {
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
