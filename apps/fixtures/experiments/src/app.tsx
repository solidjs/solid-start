import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import Provider from "./components/Provider";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Provider initialCount={10}>
            <Title>SolidStart - Bare</Title>
            <a href="/">Index</a>
            <a href="/about">About</a>
            <Suspense>{props.children}</Suspense>
          </Provider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
