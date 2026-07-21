import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Loading } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>SolidStart - CSS Fixture</Title>
          <div class="mx-auto max-w-5xl p-10 pt-3">
            <header class="flex gap-3 mb-4">
              <a href="/">Index</a>
              <a href="/empty">Empty</a>
              <a href="/unstyled">Unstyled</a>
            </header>

            <Loading>{props.children}</Loading>
          </div>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
