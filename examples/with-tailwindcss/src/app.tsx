// @refresh reload
import { Router, Routes } from "@solidjs/router";
import { DefaultErrorBoundary, FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import "./app.css";

export default function App() {
  return (
    <Router>
      <Nav />
      <DefaultErrorBoundary>
        <Suspense>
          <Routes>
            <FileRoutes />
          </Routes>
        </Suspense>
      </DefaultErrorBoundary>
    </Router>
  );
}
