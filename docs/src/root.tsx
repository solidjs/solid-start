// @refresh reload
import { Links, Meta, Outlet, Scripts } from "solid-start/components";

import "./code.css";
import "virtual:windi.css";

import { MDXProvider } from "solid-mdx";
import { Component } from "solid-js";
import { Link } from "solid-app-router";

export default function Root() {
  console.log({ MDXProvider });
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <MDXProvider
          components={{
            h1: props => (
              <h1 {...props} class="text-6xl font-400">
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
            Link,
            Outlet
          }}
        >
          <Outlet />
        </MDXProvider>
        <Scripts />
      </body>
    </html>
  );
}
