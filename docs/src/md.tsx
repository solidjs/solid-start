import { Link } from "solid-app-router";
import { createEffect } from "solid-js";
import "tippy.js/dist/tippy.css";
export default {
  h1: props => (
    <h1 {...props} class="text-6xl font-400 mb-4 border-b-2 p-2 mt-4">
      {props.children}
    </h1>
  ),
  h2: props => (
    <h2 {...props} class="text-5xl font-400 mb-4 border-b-2 p-2 mt-4">
      {props.children}
    </h2>
  ),
  h3: props => (
    <h3 {...props} class="text-4xl font-400 mb-4 border-b-2 p-2 mt-4">
      {props.children}
    </h3>
  ),
  h4: props => (
    <h4 {...props} class="text-3xl font-400">
      {props.children}
    </h4>
  ),
  h5: props => (
    <h5 {...props} class="text-2xl font-400">
      {props.children}
    </h5>
  ),
  h6: props => (
    <h6 {...props} class="text-xl font-400">
      {props.children}
    </h6>
  ),
  p: props => (
    <p {...props} class="text-lg font-400 my-4">
      {props.children}
    </p>
  ),
  a: props => (
    <Link {...props} class="text-blue-500">
      {props.children}
    </Link>
  ),
  li: props => (
    <li {...props} class="my-2">
      {props.children}
    </li>
  ),
  ul: props => (
    <ul {...props} class="list-disc pl-8 my-2">
      {props.children}
    </ul>
  ),
  ol: props => (
    <ol {...props} class="list-decimal pl-8 my-2">
      {props.children}
    </ol>
  ),
  nav: props => <nav {...props}>{props.children}</nav>,
  Link,
  TesterComponent: props => (
    <p>Remove This Now!!! If you see this it means that markdown custom components does work</p>
  ),
  code: props => <code class="font-mono inline-block">{props.children}</code>,
  pre: props => (
    <pre
      {...props}
      class="bg-gray-200 p-2 rounded-lg text-xs font-mono"
      classList={{ "py-8": props.title }}
    >
      {props.children}
    </pre>
  ),
  "data-lsp": props => {
    createEffect(() => {
      console.log(props);
    });
    return (
      <span class="data-lsp" data-template={props.lsp}>
        {props.children}
        <div id={props.lsp} style="display: none;">
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
  }
};
