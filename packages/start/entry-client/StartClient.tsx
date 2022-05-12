import { MetaProvider } from "solid-meta";
import { Router } from "solid-app-router";
import { StartProvider } from "../server/StartContext";
import Root from "~/root";

const rootData = Object.values(import.meta.globEager("/src/root.data.(js|ts)"))[0];
const dataFn = rootData ? rootData.default : undefined;

export default () => {
  return (
    <StartProvider>
      <MetaProvider>
        <Router data={dataFn}>
          <Root />
        </Router>
      </MetaProvider>
    </StartProvider>
  );
};
