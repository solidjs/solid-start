// @refresh reload
import { Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Link,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import "./root.css";

export default function Root() {
  return (
    <Html lang="en" data-theme="light">
      <Head>
        <Link rel="stylesheet" href="/fonts/styles.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@pluralsight/design-tokens@next/npm/normalize/normalize.css"
        />

        <Title>SolidStart - With Auth</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading</div>}>
            <Routes>
              <FileRoutes />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Scripts />
      </Body>
    </Html>
  );
}
