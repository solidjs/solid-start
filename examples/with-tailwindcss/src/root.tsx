// @refresh reload
import { Suspense } from "solid-js";
import { Body, ErrorBoundary, FileRoutes, Head, Html, Meta, Routes, Scripts } from "solid-start";
import "./root.css";
import { Title } from "@solidjs/meta";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - With TailwindCSS</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <a class="mr-2" href="/">
              Index
            </a>
            <a href="/about">About</a>
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
