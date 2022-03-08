import { Link } from "solid-app-router";
import { createEffect, createMemo, createUniqueId } from "solid-js";
import tippy from "tippy.js";
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

function getAnchor(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/[ ]/g, "-");
}

function Anchor(props) {
  const anchor = () => getAnchor(props.text);
  return (
    <a
      href={`#${anchor()}`}
      aria-label="Link for ${Text}"
      title="Link for ${Text}"
      class="jsx-1906412371 anchor inline-block"
    >
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 13 13"
        xmlns="http://www.w3.org/2000/svg"
        class="jsx-1906412371 text-gray-70 ml-2 h-5 w-5"
      >
        <g fill="currentColor" fill-rule="evenodd" class="jsx-1906412371">
          <path
            d="M7.778 7.975a2.5 2.5 0 0 0 .347-3.837L6.017 2.03a2.498 2.498 0 0 0-3.542-.007 2.5 2.5 0 0 0 .006 3.543l1.153 1.15c.07-.29.154-.563.25-.773.036-.077.084-.16.14-.25L3.18 4.85a1.496 1.496 0 0 1 .002-2.12 1.496 1.496 0 0 1 2.12 0l2.124 2.123a1.496 1.496 0 0 1-.333 2.37c.16.246.42.504.685.752z"
            class="jsx-1906412371"
          ></path>
          <path
            d="M5.657 4.557a2.5 2.5 0 0 0-.347 3.837l2.108 2.108a2.498 2.498 0 0 0 3.542.007 2.5 2.5 0 0 0-.006-3.543L9.802 5.815c-.07.29-.154.565-.25.774-.036.076-.084.16-.14.25l.842.84c.585.587.59 1.532 0 2.122-.587.585-1.532.59-2.12 0L6.008 7.68a1.496 1.496 0 0 1 .332-2.372c-.16-.245-.42-.503-.685-.75z"
            class="jsx-1906412371"
          ></path>
        </g>
      </svg>
    </a>
  );
}

export default {
  h1: props => (
    <h1
      {...props}
      class="heading mt-0 text-primary dark:text-primary-dark -mx-.5 break-words text-5xl font-bold leading-tight"
    >
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
      {/* <Anchor text={children(() => props.children)} /> */}
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
    <h5 {...props} class="text-xl leading-9 my-4 font-medium">
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
    const id = createUniqueId();
    createEffect(() => {
      tippy(`[data-template="${id}"]`, {
        content() {
          const template = document.getElementById(id);
          return template.innerHTML;
        },
        allowHTML: true
      });
    });
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
  },
  terminal: Terminal,
  title: Title
};
