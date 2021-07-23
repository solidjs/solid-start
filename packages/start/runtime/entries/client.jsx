import { hydrate } from "solid-js/web";
import { MetaProvider } from "solid-meta";
import { Router } from "solid-app-router";
import { StartProvider } from "../../components";
import Root from "~/root";

const Start = props => (
  <StartProvider>
    <MetaProvider>
      <Router>{props.children}</Router>
    </MetaProvider>
  </StartProvider>
);

hydrate(() => <Root Start={Start} manifest={{}} />, document);
