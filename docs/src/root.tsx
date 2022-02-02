// @refresh reload
import { Links, Meta, Outlet, Scripts } from "solid-start/components";

import "./code.css";
import "virtual:windi.css";

import { MDXProvider } from "solid-mdx";
import Nav from "./Nav";
import md from "./md";

export default function Root() {
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
            ...md
          }}
        >
          <Nav />
          <Outlet />
        </MDXProvider>
        <Scripts />
      </body>
    </html>
  );
}
