// @refresh reload
import { A, Router, Routes } from "@solidjs/router";
import { DefaultErrorBoundary, FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router>
      <main>
        <A href="/">Index</A>
        <A href="/about">About</A>
        <DefaultErrorBoundary>
          <Suspense>
            <Routes>
              <FileRoutes />
            </Routes>
          </Suspense>
        </DefaultErrorBoundary>
      </main>
    </Router>
  );
}
