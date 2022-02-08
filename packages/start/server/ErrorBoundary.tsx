import { useLocation, useNavigate } from "solid-app-router";
import {
  ErrorBoundary as ErrorBoundaryBase,
  JSX,
  PropsWithChildren,
  resetErrorBoundaries,
  Show,
  startTransition
} from "solid-js";

import { isRedirectResponse, LocationHeader } from ".";

export function ErrorBoundary(props: PropsWithChildren<{ fallback?: (e: any) => JSX.Element }>) {
  const navigate = useNavigate();
  const location = useLocation();

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
              startTransition(() => {
                navigate(res.headers.get(LocationHeader));
                resetErrorBoundaries();
              });

              return null;
            }}
          >
            <div class="p-6">
              <div class="bg-red-300 text-red-800 rounded-md p-6 overflow-scroll">
                <p class="font-bold" id="error-message">
                  {e.message}
                </p>
                <button
                  id="reset-errors"
                  onClick={resetErrorBoundaries}
                  class="bg-red-800 text-sm text-red-300 rounded-sm px-2 py-1"
                >
                  Clear errors and retry
                </button>
                <pre class="mt-4 text-sm w-full">{e.stack}</pre>
              </div>
            </div>
          </Show>
        );
      }}
    >
      {props.children}
    </ErrorBoundaryBase>
  );
}

export default ErrorBoundary;
