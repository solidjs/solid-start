import { createAsync, query } from "@solidjs/router";
import { setTimeout } from "node:timers/promises";
import { createSignal, lazy, onMount, Show } from "solid-js";
import NotFound from "../components/NotFound";
import cssUrl from "../stylesWithUrl.css?url";
import cssUrl2 from "../stylesWithUrlNotRendered.css?url";
import "./index.css";
import classes from "./index.module.css";

const Counter = lazy(() => import("../components/Counter"));

const getData = query(async () => {
  "use server";
  await setTimeout(1000);
  return "CSS Tests";
}, "data");

export default function Home() {
  const data = createAsync(() => getData(), { deferStream: true });
  const [mounted, setMounted] = createSignal(false);
  onMount(() => setMounted(true));
  return (
    <main>
      <link rel="stylesheet" href={cssUrl} />
      <Show when={false}>
        <link rel="stylesheet" href={cssUrl2} />
      </Show>
      <Show when={false}>
        <Counter />
      </Show>
      <Show when={!data()}>
        <NotFound />
      </Show>
      <div class="flex gap-2 flex-col">
        <h1 class="flex items-center gap-2 text-left text-2xl font-bold">
          {data()}
          <div class="text-base text-white bg-gray-700 rounded-lg px-2">
            Mode: {import.meta.env.DEV ? "DEV" : "PROD"}
          </div>
          <div class="text-base text-white bg-gray-700 rounded-lg px-2">
            {!mounted() ? "Just SSR" : "Hydrated"}
          </div>
        </h1>
        <small class="mb-4 text-gray-600">
          Enable throttling & disable cache in the network tab to see eventual frames of unstyled
          content.
        </small>
        <div class="flex gap-2 items-center text-sm text-gray-700">
          <div>Status colors:</div>
          <div class="grid content-center rounded-lg text-white bg-[seagreen] px-2 uppercase font-bold">
            pass
          </div>
          <div class="grid content-center rounded-lg text-white bg-[crimson] px-2 uppercase font-bold">
            fail
          </div>
        </div>
        <div class="test appStyle">global app.css</div>
        <div class="test routeStyle">route css</div>
        <div class={"test " + classes["moduleStyle"]}>route css module</div>
        <div class="test urlStyle">{"?url with jsx <link>"}</div>
        <div class="test appStyle urlStyle--notRendered">{"?url without <link>"}</div>
        <div class="test appStyle urlStyle--lazy">{"?url without <link> in lazy component"}</div>
      </div>
    </main>
  );
}
