// @refresh reload
import "./root.css";

import { Suspense } from "solid-js";
import {
  A, Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html, Link, Meta,
  Routes,
  Scripts,
  Title
} from "solid-start";

import PromptPWA from "./components/PromptPWA";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - PWA w/CSR</Title>

        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />

        <Meta name="theme-color" content="#2c4f7c" />
        <Link rel="icon" href="/favicon.ico" sizes="any" />
        <Link rel="apple-touch-icon" href="/img/apple-touch-icon.png" sizes="180x180" />

        <Meta name="title" content="SolidStart" />
        <Meta name="description" content="A minimal PWA to show how to use vite-plugin-pwa in SolidStart with CSR and no 'index.html' file." />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <PromptPWA />

            <A href="/">Index</A>
            <A href="/about">About</A>
            
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