// @refresh reload
import { Navigate, useNavigate } from "solid-app-router";
import {
  createEffect,
  ErrorBoundary,
  refetchResources,
  resetErrorBoundaries,
  Show,
  Suspense
} from "solid-js";
import { Links, Meta, Routes, Scripts } from "solid-start/components";
import { isRedirectResponse, LocationHeader } from "solid-start/server";
import "virtual:windi.css";

export default function Root() {
  const navigate = useNavigate();
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ErrorBoundary
          fallback={e => (
            <Show
              when={!(e instanceof Response && isRedirectResponse(e))}
              fallback={() => {
                console.log("NAVIGATION");
                navigate(e.headers.get(LocationHeader));
                resetErrorBoundaries();
                return null;
              }}
            >
              <div class="p-6">
                <div class="bg-red-300 text-red-800 rounded-md p-6 overflow-scroll">
                  <p class="font-bold">{e.message}</p>
                  <button
                    onClick={resetErrorBoundaries}
                    class="bg-red-800 text-sm text-red-300 rounded-sm px-2 py-1"
                  >
                    Clear errors and retry
                  </button>
                  <pre class="mt-4 text-sm w-full">{e.stack}</pre>
                </div>
              </div>
            </Show>
          )}
        >
          <Suspense>
            <Routes />
          </Suspense>
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}
