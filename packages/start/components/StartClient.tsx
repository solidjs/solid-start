import { MetaProvider } from "solid-meta";
import { Router } from "solid-app-router";
import { StartProvider } from "./StartContext";
// @ts-expect-error
import Root from "~/root";
import { createSignal } from "solid-js";

const rootData = Object.values(import.meta.globEager("/src/root.data.(js|ts)"))[0];
const dataFn = rootData ? rootData.default : undefined;
const [request, setRequest] = createSignal(new Request("http://localhost:3000/"));

export default () => {
  return (
    <StartProvider
      context={{
        responseHeaders: new Headers(),
        request: request()
      }}
    >
      <MetaProvider>
        <Router data={dataFn}>
          <Root />
        </Router>
      </MetaProvider>
    </StartProvider>
  );
};
