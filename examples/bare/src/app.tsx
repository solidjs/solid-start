// @refresh reload
import { A, Routes } from "@solidjs/router";
import { DefaultErrorBoundary, FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";
import "./app.css";
import Provider from "./components/Provider";

export default function App() {
  return (
    <>
      <A href="/">Index</A>
      <A href="/about">About</A>
      <Provider initialCount={10}>
        <DefaultErrorBoundary>
          <Suspense>
            <Routes>
              <FileRoutes />
            </Routes>
          </Suspense>
        </DefaultErrorBoundary>
      </Provider>
    </>
  );
}
