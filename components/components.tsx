import { Title as MetaTitle } from "@solidjs/meta";
import { createUniqueId, mergeProps, Show } from "solid-js";
import { unstable_island } from "solid-start";
import "tippy.js/dist/tippy.css";
import A from "./A";
const Tooltip = unstable_island(() => import("./tooltip"));

export const components = {
  strong: props => <span class="font-bold">{props.children}</span>,
  h1: props => (
    <h1 {...props}>
      <MetaTitle>{props.children}</MetaTitle>
      {props.children}
    </h1>
  ),
  ssr: props => <>{props.children}</>,
  spa: props => <></>,
  p: props => <p {...props}>{props.children}</p>,
  a: props => {
    return (
      <A
        {...props}
        style="text-decoration: none"
        class="dark:text-link-dark break-normal hover:border-opacity-100 duration-100 ease-in  transition font-semibold leading-normal"
      >
        {props.children}
      </A>
    );
  },
  "token-link": props => {
    return (
      <span class="code-step bg-opacity-10 dark:bg-opacity-20 relative rounded px-1 py-[1.5px] border-b-[2px] border-opacity-60 bg-yellow-400 border-yellow-400 text-yellow-600 dark:text-yellow-300">
        {props.children}
      </span>
    );
  },
  li: props => (
    <li {...props} class="mb-2">
      {props.children}
    </li>
  ),
  ul: props => (
    <ul {...props} class="list-disc pl-8 mb-2">
      {props.children}
    </ul>
  ),
  ol: props => (
    <ol {...props} class="list-decimal pl-8 mb-2">
      {props.children}
    </ol>
  ),
  nav: props => <nav {...props}>{props.children}</nav>,
  A,
  "table-of-contents": props => {},
  code: props => {
    return (
      <span class="not-prose">
        <code
          className="inline text-code text-secondary dark:text-secondary-dark rounded-md no-underline bg-slate-300 bg-opacity-20"
          {...props}
        >
          {props.children}
        </code>
      </span>
    );
  },
  pre: props => (
    <div>
      <Show when={props.filename?.length > 5}>
        <div
          class={`px-3 py-1 w-full text-xs bg-slate-500 rounded-t text-slate-100 ${props.className}`}
        >
          {props.filename}
        </div>
      </Show>
      <pre
        {...mergeProps(props, {
          get classList() {
            return {
              [props.className]: true,
              ["rounded-b mt-0 px-0"]: true,
              ["border-red-400 border-2 bad"]: props.bad,
              ["border-green-400 border-2 good"]: props.good,
              ["snippet"]: !props.good && !props.bad,
              ["rounded-t-none"]: props.filename?.length
            };
          },
          get className() {
            return undefined;
          }
        })}
      >
        {props.children}
      </pre>
    </div>
  ),
  "data-lsp": props => {
    const id = createUniqueId();

    return (
      <Tooltip id={id}>
        <span
          classList={{
            "code-step bg-opacity-10 dark:bg-opacity-20 relative rounded px-1 py-[1.5px] border-b-[2px] border-opacity-60 bg-yellow-400 border-yellow-400 text-yellow-600 dark:text-yellow-300":
              props.style?.borderBottom
          }}
        >
          {props.children}
        </span>
        <div id={id} style="display: none;">
          <pre class="text-white bg-transparent text-[0.65em] p-0 m-0 border-0 w-full whitespace-pre-wrap">
            {props.lsp}
          </pre>
        </div>
      </Tooltip>
    );
  },
  h5: props => (
    <h5 {...props} class="text-lg mb-4">
      {props.children}
    </h5>
  ),
  "docs-error": props => {
    return (
      <div class="docs-error">
        <p>
          <span class="text-red-500">Error:</span>
          {props.children}
        </p>
      </div>
    );
  },
  "docs-info": props => {
    return (
      <div class="docs-error">
        <p>
          <span class="text-red-500">Error:</span>
          {props.children}
        </p>
      </div>
    );
  },
  aside: props => (
    <aside
      {...props}
      class="bg-orange-200 text-orange-900 dark:bg-slate-700 p-6 rounded-md space-y-2"
    >
      <div class="font-bold uppercase text-sm">WARNING</div>
      <div>{props.children}</div>
    </aside>
  ),
  response: props => {
    return <span class="border-1">{props.children}</span>;
  },
  void: props => {
    return <span>{props.children}</span>;
  },
  unknown: props => {
    return <span>{props.children}</span>;
  }
};
