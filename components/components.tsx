import { Title as MetaTitle } from "@solidjs/meta";
import { createUniqueId, mergeProps } from "solid-js";
import A from "./A";

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
    <>
      {/* <Show when={props.filename?.length > 5}>
              <span {...props} class="h-4 p-1">
                {props.filename}
              </span>
            </Show> */}
      <pre
        {...mergeProps(props, {
          get class() {
            return props.className + " " + (props.bad ? "border-red-400 border-1" : "");
          },
          get className() {
            return undefined;
          }
        })}
      >
        {props.children}
      </pre>
    </>
  ),
  "data-lsp": props => {
    const id = createUniqueId();
    // createEffect(() => {
    //   tippy(`[data-template="${id}"]`, {
    //     content() {
    //       const template = document.getElementById(id);
    //       return template.innerHTML;
    //     },
    //     allowHTML: true
    //   });
    // });
    return (
      <span class={`data-lsp`} data-template={id}>
        {props.children}
        <div id={id} style="display: none;">
          <pre class="text-white bg-transparent text-xs p-0 m-0 border-0">{props.lsp}</pre>
        </div>
      </span>
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
    return <span>{props.children}</span>;
  },
  void: props => {
    return <span>{props.children}</span>;
  },
  unknown: props => {
    return <span>{props.children}</span>;
  }
};
