import { MetaProvider, Title } from "@solidjs/meta";
import {Router} from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import {Suspense} from "solid-js";
import "./app.css";
import {LangProvider} from "./lang/core";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <LangProvider>
            <Title>SolidStart - Paraglide</Title>
            <Suspense>{props.children}</Suspense>
          </LangProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
