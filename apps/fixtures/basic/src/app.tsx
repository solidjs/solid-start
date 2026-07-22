import { MetaProvider, Title } from "@solidjs/meta";
import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/start/router";
import { Loading } from "solid-js";
import "./app.css";

const Router = createRouter({ routes: fileRoutes });

export default function App() {
  return (
    <Router>
      {(props) => (
        <MetaProvider>
          <Title>SolidStart - Basic</Title>
          <a href="/">Index</a>
          <a href="/about">About</a>
          <Loading>{props.children}</Loading>
        </MetaProvider>
      )}
    </Router>
  );
}
