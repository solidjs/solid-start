// @refresh reload
import { Routes as BaseRoutes } from "solid-app-router";
import { Suspense } from "solid-js";
import { ErrorBoundary } from "solid-start/error-boundary";
import { FileRoutes, Links, Meta, Scripts } from "solid-start/root";
import { Outlet } from "solid-start/server/router";
import Nav from "./components/nav";
import "./root.css";

export function Routes() {
  if (import.meta.env.START_ISLANDS_ROUTER) {
    return (
      <Outlet>
        <BaseRoutes>
          <FileRoutes />
        </BaseRoutes>
      </Outlet>
    );
  } else {
    return (
      <BaseRoutes>
        <FileRoutes />
      </BaseRoutes>
    );
  }
}

export default function Root() {
  return (
    <html lang="en">
      <head>
        <title>Solid - Hacker News</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Hacker News Clone built with Solid" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <Links />
        <Meta />
      </head>
      <body>
        <Nav />
        <ErrorBoundary>
          <Suspense fallback={<div class="news-list-nav">Loading...</div>}>
            {/* <Outlet /> */}
            <Routes />
          </Suspense>
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}

// if (import.meta.env.PROD && !isServer && "serviceWorker" in navigator) {
//   // Use the window load event to keep the page load performant
//   window.addEventListener("load", () => {
//     navigator.serviceWorker.register(`/sw.js`);
//   });
// }
