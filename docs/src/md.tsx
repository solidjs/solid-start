import { Link } from "solid-app-router";

export default {
    h1: props => (
        <h1 {...props} class="text-6xl font-400 mb-4 border-b-2 p-2">
            {props.children}
        </h1>
    ),
    h2: props => (
        <h2 {...props} class="text-5xl font-400">
            {props.children}
        </h2>
    ),
    h3: props => (
        <h3 {...props} class="text-4xl font-400">
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
    a: props => (
        <Link {...props} class="text-blue-500">
            {props.children}
        </Link>
    ),
    li: props => <li {...props} class="my-2">{props.children}</li>,
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
        <p>
            Remove This Now!!! If you see this it means that markdown custom components does
            work
        </p>
    ),
    code: props => (
        <code class="bg-gray-200 p-2 rounded-lg text-xs font-mono inline-block">
            {props.children}
        </code>
    ),
};