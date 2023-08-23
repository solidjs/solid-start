// @refresh reload
import { Routes } from "@solidjs/router";
import { DefaultErrorBoundary, FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";
import "./app.css";
import Nav from "./components/nav";

export default function App() {
  return (
    <>
      <Nav />
      <DefaultErrorBoundary>
        <Suspense fallback={<div class="news-list-nav">Loading...</div>}>
          <Routes>
            <FileRoutes />
          </Routes>
        </Suspense>
      </DefaultErrorBoundary>
    </>
  );
}
