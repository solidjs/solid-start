import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>SolidStart - CSS Tests</Title>
          <div class="mx-auto max-w-5xl p-10 text-gray-800">
            <header class="flex gap-3 underline mb-4">
              <a class="text-blue-800" href="/">
                Index
              </a>
              <a class="text-blue-800" href="/about">
                About
              </a>
            </header>

            <Suspense>{props.children}</Suspense>
          </div>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
