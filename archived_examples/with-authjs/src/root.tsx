// @refresh reload
import { SessionProvider } from "@solid-auth/base/client";
import { Suspense } from "solid-js";
import {
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title
} from "solid-start";
import "./root.css";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart + AuthJS</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <SessionProvider>
            <ErrorBoundary>
              <A href="/">Home</A>
              <A href="/protected">Protected</A>
              <Routes>
                <FileRoutes />
              </Routes>
            </ErrorBoundary>
          </SessionProvider>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
