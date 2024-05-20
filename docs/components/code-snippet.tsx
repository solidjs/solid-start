import { Tabs } from "@kobalte/core";
import { cache, createAsync } from "@solidjs/router";
import { Suspense } from "solid-js";
// import { YarnIcon } from "./icons/yarn-icon";
// import { NpmIcon } from "./icons/npm-icon";
// import { PnpmIcon } from "./icons/pnpm-icon";

const getSolidStartVersion = cache(async () => {
  "use server";

  const response = await fetch(
    "https://registry.npmjs.org/@solidjs/start/latest"
  );

  const { version } = await response.json();

  return version;
}, "npm-version");

export function CodeSnippet() {
  const npmVersion = createAsync(() => getSolidStartVersion());
  return (
    <aside class="pt-20 px-8 sm:px-4 md:px-0 md:max-w-96 max-w-screen mx-auto w-5/6">
      <Tabs.Root defaultValue="pnpm">
        <Tabs.List class="flex justify-between pb-10">
          <Tabs.Trigger
            value="pnpm"
            class="scale-75 grayscale opacity-70 focus:grayscale-0 focus:opacity-100 hover:grayscale-0 hover:opacity-100 transition-all ease-in-out duration-500 data-[selected]:scale-100 data-[selected]:grayscale-0 data-[selected]:opacity-100"
          >
            pnpm
          </Tabs.Trigger>
          <Tabs.Trigger
            value="npm"
            class="scale-75 grayscale opacity-70 focus:grayscale-0 focus:opacity-100 hover:grayscale-0 hover:opacity-100 transition-all ease-in-out duration-500 data-[selected]:scale-100 data-[selected]:grayscale-0 data-[selected]:opacity-100"
          >
            npm
          </Tabs.Trigger>
          <Tabs.Trigger
            value="yarn"
            class="scale-75 grayscale opacity-70 focus:grayscale-0 focus:opacity-100 hover:grayscale-0 hover:opacity-100 transition-all ease-in-out duration-500 data-[selected]:scale-100 data-[selected]:grayscale-0 data-[selected]:opacity-100"
          >
            yarn
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="pnpm" class="relative">
          <div class="hidden dark:block absolute inset-0 bg-gradient-to-tr from-blue-300 via-blue-300/70 to-blue-300 opacity-10" />
          <div
            id="upper-line"
            class="absolute -top-px left-20 right-11 h-px bg-gradient-to-r from-blue-300/0 via-blue-300/70 to-blue-300/0 animate-bounce"
          />
          <div
            id="bottom-line"
            class="absolute -bottom-px left-11 right-20 h-px bg-gradient-to-r from-blue-400/0 via-blue-800 dark:via-blue-400 to-blue-400/0 animate-bounce"
          ></div>
          <pre class="text-2xl md:text-3xl font-mono py-2 dark:shadow-[0px_0px_35px_rgb(125,211,252,0.3)] flex justify-center">
            <span class="dark:text-cyan-200 text-cyan-700">pnpm</span> create
            solid
          </pre>
        </Tabs.Content>
        <Tabs.Content value="npm" class="relative">
          <div class="hidden dark:block absolute inset-0 bg-gradient-to-tr from-blue-300 via-blue-300/70 to-blue-300 opacity-10" />
          <div
            id="upper-line"
            class="absolute -top-px left-20 right-11 h-px bg-gradient-to-r from-blue-300/0 via-blue-300/70 to-blue-300/0 animate-bounce"
          ></div>
          <div
            id="bottom-line"
            class="absolute -bottom-px left-11 right-20 h-px bg-gradient-to-r from-blue-400/0 via-blue-800 dark:via-blue-400 to-blue-400/0 animate-bounce"
          ></div>
          <pre class="text-2xl md:text-3xl font-mono py-2 px-5 flex justify-center dark:shadow-[0px_0px_35px_rgb(125,211,252,0.3)]">
            <span class="dark:text-cyan-200 text-cyan-600">npm</span> create
            solid
          </pre>
        </Tabs.Content>
        <Tabs.Content value="yarn" class="relative">
          <div class="hidden dark:block absolute inset-0 bg-gradient-to-tr from-blue-300 via-blue-300/70 to-blue-300 opacity-10" />
          <div
            id="upper-line"
            class="absolute -top-px left-20 right-11 h-px bg-gradient-to-r from-blue-300/0 via-blue-300/70 to-blue-300/0 animate-bounce"
          ></div>
          <div
            id="bottom-line"
            class="absolute -bottom-px left-11 right-20 h-px bg-gradient-to-r from-blue-400/0 via-blue-800 dark:via-blue-400 to-blue-400/0 animate-bounce"
          ></div>
          <pre class="text-2xl md:text-3xl font-mono py-2 px-5  flex justify-center dark:shadow-[0px_0px_35px_rgb(125,211,252,0.3)]">
            <span class="dark:text-cyan-200 text-cyan-600">yarn</span> create
            solid
          </pre>
        </Tabs.Content>
      </Tabs.Root>
      <Suspense>
        <small class="font-mono text-right pt-2 inline-block w-full dark:text-sky-400/60 text-sky-950">
          latest version: {npmVersion()}
        </small>
      </Suspense>
    </aside>
  );
}
