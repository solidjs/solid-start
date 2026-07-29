import { MetaProvider, Title } from "@solidjs/meta";
import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/start/router";
import { Loading } from "solid-js";
import "./app.css";

const Router = createRouter({ routes: fileRoutes });

export default function App() {
  return (
    <Router>
      {props => (
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
    </Router>
  );
}
