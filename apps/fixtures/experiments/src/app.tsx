import { MetaProvider, Title } from "@solidjs/meta";
import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/start/router";
import { Loading } from "solid-js";
import "./app.css";
import Provider from "./components/Provider";

const Router = createRouter({ routes: fileRoutes });

export default function App() {
  return (
    <Router>
      {props => (
        <MetaProvider>
          <Provider initialCount={10}>
            <Title>SolidStart - Bare</Title>
            <a href="/">Index</a>
            <a href="/about">About</a>
            <Loading>{props.children}</Loading>
          </Provider>
        </MetaProvider>
      )}
    </Router>
  );
}
