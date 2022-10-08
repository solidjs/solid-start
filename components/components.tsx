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
        class="dark:text-link-dark break-normal border-b border-solid-default border-opacity-0 hover:border-opacity-100 duration-100 ease-in transition font-semibold leading-normal"
      >
        {props.children}
      </A>
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
  code: props => {
    return (
      <code className="inline text-code font-mono" {...props}>
        {props.children}
      </code>
    );
  },
  pre: props => (
    <div>
      <Show when={props.filename?.length > 5}>
        <div {...props} class="px-3 py-1 w-full text-xs bg-blueGray-500 rounded-t">
          {props.filename}
        </div>
      </Show>
      <pre
        {...mergeProps(props, {
          get class() {
            return (
              props.className +
              " rounded-b rounded-t-none mt-0 px-0 " +
              (props.bad ? "border-red-400 border-4" : "")
            );
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
        {props.children}
        <div id={id} style="display: none;">
          <pre class="text-white bg-transparent text-xs p-0 m-0 border-0">{props.lsp}</pre>
        </div>
      </Tooltip>
    );
  },
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
