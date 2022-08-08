// @refresh reload
import { Routes } from "@solidjs/router";
import { Suspense } from "solid-js";
import { ErrorBoundary } from "solid-start/error-boundary";
import { Body, FileRoutes, Head, Html, Links, Meta, Scripts } from "solid-start/root";
import { Title } from "@solidjs/meta";
import "./root.css";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - Durable Objects WebSocket</Title>
        <Meta />
        <Links />
      </Head>
      <Body>
        <ErrorBoundary>
          <Suspense>
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
