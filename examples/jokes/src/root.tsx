// @refresh reload
import { Links, Outlet, Scripts } from "solid-start/components";
import { ErrorBoundary, Suspense } from "solid-js";
// import { isServer } from "solid-js/web";
// import Nav from "./components/nav";
import "./styles/global.css";
// import "./styles/global-medium.css";
// import "./styles/global-large.css";

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Hacker News Clone built with Solid" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <Links />
      </head>
      <body>
        {/* <Nav /> */}
        <ErrorBoundary
          fallback={(err, reset) => {
            console.log(err);
            return (
              <div onClick={reset}>
                {err.toString()} {err.stack}
              </div>
            );
          }}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <Outlet />
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
