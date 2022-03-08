// @refresh reload
import { Links, Meta, Routes, Scripts } from "solid-start/root";

import "./code.css";
import "virtual:windi.css";

import { MDXProvider } from "solid-mdx";
import Nav from "./components/Nav";
import md from "./md";
import { createEffect } from "solid-js";
import tippy from "tippy.js";

export default function Root() {
  createEffect(() => {
    tippy("[data-template]", {
      content(reference) {
        const id = reference.getAttribute("data-template");
        const template = document.getElementById(id);
        return template.innerHTML;
      },
      allowHTML: true
    });
  });
  return (
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body class="min-h-full flex flex-row">
        <MDXProvider
          components={{
            ...md
          }}
        >
          <Nav />
          <div class="h-screen overflow-scroll flex-1 bg-blue-50 px-12">
            <div class="flex flex-col w-full">
              <Routes />
            </div>
          </div>
        </MDXProvider>
        <Scripts />
      </body>
    </html>
  );
}
