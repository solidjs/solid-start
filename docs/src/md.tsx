import { Link } from "solid-app-router";
import { createEffect, createMemo } from "solid-js";
import "tippy.js/dist/tippy.css";
import { Title } from "./components/Main";
import Terminal from "./components/Terminal";
let hashCode = function (str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

export default {
  h1: props => (
    <h1 {...props} class="text-6xl font-400 mb-4 border-b-2 p-2 mt-4">
      {props.children}
    </h1>
  ),
  ssr: props => <>{props.children}</>,
  spa: props => <></>,
  h2: props => (
    <h2
      {...props}
      class="heading text-3xl leading-10 text-primary dark:text-primary-dark font-bold my-6"
    >
      {props.children}
    </h2>
  ),
  h3: props => (
    <h3
      {...props}
      class="heading text-2xl leading-9 text-primary dark:text-primary-dark font-bold my-6"
    >
      {props.children}
    </h3>
  ),
  h4: props => (
    <h4 {...props} class="heading text-xl font-bold leading-9 my-4">
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
    <Link
      {...props}
      class="text-link dark:text-link-dark break-normal border-b border-link border-opacity-0 hover:border-opacity-100 duration-100 ease-in transition leading-normal"
    >
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
  code: props => (
    <code className="inline text-code font-mono" {...props}>
      {props.children}
    </code>
  ),
  pre: props => (
    <pre classList={{ "font-mono": true }} {...props}>
      {props.children}
    </pre>
  ),
  "data-lsp": props => {
    const lspHash = createMemo(() => hashCode(props.lsp).toString());
    return (
      <span class="data-lsp" data-template={lspHash()}>
        {props.children}
        <div id={lspHash()} style="display: none;">
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
  terminal: Terminal,
  title: Title
};
