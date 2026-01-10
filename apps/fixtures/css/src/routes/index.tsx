import { createAsync, query } from "@solidjs/router";
import { lazy, Show } from "solid-js";
import "virtual:virtualModule.css";
import Layout from "../components/layout";
import { CommonTests } from "../components/test";
import notRenderedInlineCSS from "../styles/notRendered.css?url";
import "../styles/route.css";
import classes from "../styles/route.module.css";
import renderedInlineCSS from "../styles/url.css?url";

const Lazy = lazy(() => import("../components/lazy"));
const LazyLink = lazy(() => import("../components/lazyLink"));
const LazyLinkTmp = lazy(() => import("../components/lazyLinkTmp"));

const entries = import.meta.glob("../components/lazyG*.tsx");
const LazyGlob = lazy(Object.values(entries)[0] as any);

const SharedChunk = lazy(() => import("../components/sharedChunk/lazy1"));
// Do not remove this.
// Rollup only creates a shared chunk if there are atleast two modules.
lazy(() => import("../components/sharedChunk/lazy2"));

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
      <LazyGlob />
      <LazyLink />
      <Show when={!data()}>
        <LazyLinkTmp />
      </Show>
      <SharedChunk />

      <Layout title="CSS Tests">
        <CommonTests routeModuleClass={classes["route"]} />
      </Layout>
    </main>
  );
}
