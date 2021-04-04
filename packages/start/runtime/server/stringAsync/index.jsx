import { renderToStringAsync } from "solid-js/web";
import { Router } from "solid-app-router";
import Layout from "~/layout";
import { routes } from "../../routes";
import fetch from "node-fetch";

globalThis.fetch || (globalThis.fetch = fetch);

export function render(initialURL, ctx) {
  const App = (props) => (
    <Router routes={routes} initialURL={initialURL} out={ctx}>
      {props.children}
    </Router>
  );
  return renderToStringAsync(() => <Layout App={App} />);
}