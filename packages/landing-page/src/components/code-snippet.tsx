import { Tabs } from "@kobalte/core/tabs";
import { createResource, Suspense } from "solid-js";
import { CopyToClipboard } from "./clipboard-button";
const getSolidStartVersion = async () => {
  "use server";

  const response = await fetch("https://registry.npmjs.org/@solidjs/start/latest");

  const { version } = await response.json();

  return version;
};

export function CodeSnippet() {
  const [npmVersion] = createResource(() => getSolidStartVersion());
  return (
    <aside class="pt-20 px-4 sm:px-4 md:px-0 md:max-w-[30rem] max-w-screen mx-auto w-5/6">
      <Tabs defaultValue="pnpm">
        <Tabs.List class="flex justify-center space-x-4 pb-10">
          <Tabs.Trigger
            value="pnpm"
            class="scale-75 grayscale opacity-70 focus:grayscale-0 focus:opacity-100 hover:grayscale-0 hover:opacity-100 transition-all ease-in-out duration-500 data-[selected]:scale-100 data-[selected]:grayscale-0 data-[selected]:opacity-100"
          >
            pnpm
          </Tabs.Trigger>
          <Tabs.Trigger
            value="bun"
            class="scale-75 grayscale opacity-70 focus:grayscale-0 focus:opacity-100 hover:grayscale-0 hover:opacity-100 transition-all ease-in-out duration-500 data-[selected]:scale-100 data-[selected]:grayscale-0 data-[selected]:opacity-100"
          >
            bun
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
          <Tabs.Trigger
            value="deno"
            class="scale-75 grayscale opacity-70 focus:grayscale-0 focus:opacity-100 hover:grayscale-0 hover:opacity-100 transition-all ease-in-out duration-500 data-[selected]:scale-100 data-[selected]:grayscale-0 data-[selected]:opacity-100"
          >
            deno
          </Tabs.Trigger>
        </Tabs.List>
        <TabContent manager="pnpm" command="create solid" />
        <TabContent manager="bun" command="create solid" />
        <TabContent manager="npm" command="create solid" />
        <TabContent manager="yarn" command="create solid" />
        <TabContent manager="deno" command="run -A npm:create-solid" />
      </Tabs>
      <Suspense>
        <small class="font-mono text-right pt-2 inline-block w-full dark:text-sky-400/60 text-sky-950">
          Latest version: {npmVersion()}
        </small>
      </Suspense>
    </aside>
  );
}

function TabContent(props: { manager: string; command: string }) {
  return (
    <Tabs.Content
      value={props.manager}
      class="relative"
      aria-label={`Command to create project using ${props.manager}`}
    >
      <div
        id="upper-line"
        class="absolute -top-px left-20 right-11 h-px bg-gradient-to-r from-blue-300/0 via-blue-300/70 to-blue-300/0 animate-bounce"
      ></div>
      <div
        id="bottom-line"
        class="absolute -bottom-px left-11 right-20 h-px bg-gradient-to-r from-blue-400/0 via-blue-800 dark:via-blue-400 to-blue-400/0 animate-bounce"
      ></div>
      <pre class="text-l md:text-2xl font-mono py-2 px-5 flex justify-center dark:shadow-[0px_0px_35px_rgb(125,211,252,0.15)] rounded-md ring-1 ring-sky-950 select-all">
        <div
          aria-hidden="true"
          class="hidden dark:block absolute inset-0 bg-gradient-to-tr from-blue-300 rounded-md via-blue-300/70 to-blue-300 opacity-5 pointer-events-none"
        />
        <span class="dark:text-cyan-200 text-cyan-600">{props.manager}</span> {" " + props.command}
      </pre>

      <CopyToClipboard
        class="absolute right-4 top-3"
        manager={props.manager}
        command={props.command}
      />
    </Tabs.Content>
  );
}
