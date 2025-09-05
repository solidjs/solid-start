import { createAsync, query } from "@solidjs/router";
import { lazy, Show } from "solid-js";
import Layout from "../components/layout";
import { CommonTests } from "../components/test";
import notRenderedInlineCSS from "../styles/notRendered.css?url";
import "../styles/route.css";
import classes from "../styles/route.module.css";
import renderedInlineCSS from "../styles/url.css?url";

const Lazy = lazy(() => import("../components/lazy"));
const LazyLink = lazy(() => import("../components/lazyLink"));
const LazyMountAssets = lazy(() => import("../components/lazyMountAssets"));
const LazyLinkTmp = lazy(() => import("../components/lazyLinkTmp"));
const LazyMountAssetsTmp = lazy(() => import("../components/lazyMountAssetsTmp"));

const getData = query(async () => {
  "use server";
  await new Promise(res => setTimeout(res, 1000));
  return "CSS Tests";
}, "data");

export default function Home() {
  const data = createAsync(() => getData(), { deferStream: true });

  return (
    <main>
      <link rel="stylesheet" href={renderedInlineCSS} />
      <Show when={false}>
        <link rel="stylesheet" href={notRenderedInlineCSS} />
      </Show>
      <Lazy />
      <LazyLink />
      <LazyMountAssets />
      <Show when={!data()}>
        <LazyLinkTmp />
        <LazyMountAssetsTmp />
      </Show>

      <Layout title="CSS Tests">
        <CommonTests routeModuleClass={classes["route"]} />
      </Layout>
    </main>
  );
}
