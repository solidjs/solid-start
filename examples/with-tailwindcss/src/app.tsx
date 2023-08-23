// @refresh reload
import { A, Routes, useLocation } from "@solidjs/router";
import { DefaultErrorBoundary, FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
  const location = useLocation();
  const active = (path: string) =>
    path == location.pathname
      ? "border-sky-600"
      : "border-transparent hover:border-sky-600";
  return (
    <>
      <nav class="bg-sky-800">
        <ul class="container flex items-center p-3 text-gray-200">
          <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
            <A href="/">Home</A>
          </li>
          <li class={`border-b-2 ${active("/about")} mx-1.5 sm:mx-6`}>
            <A href="/about">About</A>
          </li>
        </ul>
      </nav>
      <DefaultErrorBoundary>
        <Suspense>
          <Routes>
            <FileRoutes />
          </Routes>
        </Suspense>
      </DefaultErrorBoundary>
    </>
  );
}
