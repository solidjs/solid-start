import { hydrate } from "solid-js/web";
import { Router } from "solid-app-router";
import Layout from "~/layout";
import { routes } from "./routes";

const App = (props) => <Router routes={routes}>{props.children}</Router>

hydrate(
  () => <Layout App={App} />,
  document.getElementById("app")
);
