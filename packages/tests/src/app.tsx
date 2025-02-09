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
          <Title>SolidStart - Basic</Title>
          <ul>
            <li>
              <a href="/">Client</a>
            </li>
            <li>
              <a href="/is-server-nested">isserver (nested)</a>
            </li>
            <li>
              <a href="/is-server-toplevel">isserver (toplevel)</a>
            </li>
            <li>
              <a href="/node-builtin-nested">node builtin (nested)</a>
            </li>
            <li>
              <a href="/node-builtin-toplevel">node builtin (toplevel)</a>
            </li>
            <li>
              <a href="/npm-module-nested">npm module (lodash) (nested)</a>
            </li>
            <li>
              <a href="/npm-module-toplevel">npm module (lodash) (toplevel)</a>
            </li>
            <li>
              <a href="/treeshaking">treeshaking (no side-effects)</a>
            </li>
            <li>
              <a href="/treeshaking/side-effects">treeshaking (w/ side-effects)</a>
            </li>
          </ul>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
