// @refresh reload
import { Suspense } from "solid-js";
import { Links, Meta, FileRoutes, Scripts } from "solid-start/root";
import { ErrorBoundary } from "solid-start/error-boundary";
import "virtual:windi.css";
import { Routes } from "solid-app-router";

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading</div>}>
            <Routes>
              <FileRoutes />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}
