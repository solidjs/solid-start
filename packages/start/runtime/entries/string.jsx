import { renderToString } from "solid-js/web";
import { MetaProvider } from "solid-meta";
import { Router } from "solid-app-router";
import Root from "~/root";
import { StartProvider } from "../../components";
import renderActions from "../actionsServer";
import fetch from "node-fetch";

globalThis.fetch || (globalThis.fetch = fetch);

export function render({ url, manifest }) {
  const context = { tags: [] };
  const Start = props => (
    <StartProvider context={context} manifest={manifest}>
      <MetaProvider tags={context.tags}>
        <Router url={url} out={context}>
          {props.children}
        </Router>
      </MetaProvider>
    </StartProvider>
  );
  return renderToString(() => <Root Start={Start} />);
}

export { renderActions };
