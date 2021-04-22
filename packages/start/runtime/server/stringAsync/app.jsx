import { renderToStringAsync } from "solid-js/web";
import { Router } from "solid-app-router";
import { MetaProvider, renderTags } from "solid-meta";
import Layout from "~/layout";
import { routes } from "../../routes";
import renderActions from "../../actionsServer";
import fetch from "node-fetch";

globalThis.fetch || (globalThis.fetch = fetch);

export function render(url, ctx) {
  const tags = [];
  ctx.add(() => renderTags(tags));
  const App = props => (
    <MetaProvider tags={tags}>
      <Router routes={routes} initialURL={url} out={ctx}>
        {props.children}
      </Router>
    </MetaProvider>
  );
  return renderToStringAsync(() => <Layout App={App} addScripts={ctx.add} />);
}

export { renderActions };