import { ssr } from "solid-js/web";
import { MetaProvider } from "solid-meta";
import { RouteDataFunc, Router } from "solid-app-router";
import Root from "~/root";
import { StartProvider } from "./StartContext";

const rootData = Object.values(import.meta.globEager("/src/root.data.(js|ts)"))[0];
const dataFn: RouteDataFunc = rootData ? rootData.default : undefined;

const docType = ssr("<!DOCTYPE html>");
export default ({
  url,
  manifest,
  context = {}
}: {
  url: string;
  manifest: Record<string, any>;
  context?: Record<string, any>;
}) => {
  context.headers = {};
  context.tags = [];
  const parsed = new URL(url);
  const path = parsed.pathname + parsed.search;

  return (
    <StartProvider context={context} manifest={manifest}>
      <MetaProvider tags={context.tags}>
        <Router url={path} out={context} data={dataFn}>
          {docType as unknown as any}
          <Root />
        </Router>
      </MetaProvider>
    </StartProvider>
  );
};
