// @refresh reload
import { MetaProvider, Title } from "@solidjs/meta";
import { A, Router, Routes } from "@solidjs/router";
import { DefaultErrorBoundary, FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";
import "./app.css";
import Provider from "./components/Provider";

export default function App() {
  return (
    <MetaProvider>
      <Router>
        <Provider initialCount={10}>
          <Title>SolidStart - Bare</Title>
          <A href="/">Index</A>
          <A href="/about">About</A>
          <DefaultErrorBoundary>
            <Suspense>
              <Routes>
                <FileRoutes />
              </Routes>
            </Suspense>
          </DefaultErrorBoundary>
        </Provider>
      </Router>
    </MetaProvider>
  );
}
