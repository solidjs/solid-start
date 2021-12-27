import { hydrate } from "solid-js/web";
import { MetaProvider } from "solid-meta";
import { Router } from "solid-app-router";
import { StartProvider } from "../../components";
import Root from "~/root";

const rootData = Object.values(import.meta.globEager("/src/root.data.(js|ts)"))[0];
const dataFn = rootData ? rootData.default : undefined;

hydrate(
  () => (
    <StartProvider>
      <MetaProvider>
        <Router data={dataFn}>
          <Root />
        </Router>
      </MetaProvider>
    </StartProvider>
  ),
  document
);
