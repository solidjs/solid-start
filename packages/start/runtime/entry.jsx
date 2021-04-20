import { hydrate } from "solid-js/web";
import { Router } from "solid-app-router";
import { MetaProvider } from "solid-meta";
import Layout from "~/layout";
import { routes } from "./routes";

const App = props => (
  <MetaProvider>
    <Router routes={routes}>{props.children}</Router>
  </MetaProvider>
);

hydrate(() => <Layout App={App} addScripts={() => {}} />, document.getElementById("app"));
