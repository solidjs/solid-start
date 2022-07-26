// @refresh reload
import { Routes } from "solid-app-router";
import { Suspense } from "solid-js";
import { Meta } from "solid-meta";
import { ErrorBoundary } from "solid-start/error-boundary";
import { Body, FileRoutes, Head, Html, Scripts } from "solid-start/root";

export default function Root() {
  DEBUG("hello-world");
  return (
    <Html lang="en">
      <Head>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <a href="/about">About</a>
            <a href="/">Index</a>
            <Routes>
              <FileRoutes />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
