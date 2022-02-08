import { useNavigate } from "solid-app-router";
import {
  ErrorBoundary as ErrorBoundaryBase,
  JSX,
  PropsWithChildren,
  resetErrorBoundaries,
  Show
} from "solid-js";

import { isRedirectResponse, LocationHeader } from ".";

export function ErrorBoundary(props: PropsWithChildren<{ fallback?: (e: any) => JSX.Element }>) {
  const navigate = useNavigate();

  return (
    <ErrorBoundaryBase
      fallback={e => {
        const data = () => {
          if (e instanceof Response) {
            return e;
          }

          try {
            let response = JSON.parse(e.message);
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
            when={!isRedirectResponse(data())}
            fallback={() => {
              let response = data();
              console.log("NAVIGATION");
              navigate(response.headers.get(LocationHeader));
              resetErrorBoundaries();
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
