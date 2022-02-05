// @refresh reload
import { Links, Meta, Routes, Scripts } from "solid-start/components";

import "./code.css";
import "virtual:windi.css";

import { MDXProvider } from "solid-mdx";
import Nav from "./components/Nav";
import md from "./md";

export default function Root() {
  return (
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body class="h-full flex flex-col">
        <MDXProvider
          components={{
            ...md
          }}
        >
          <header class="p-4 bg-orange-500 text-white">
            <h1 class="text-5xl text-center mb-4">WIP</h1>
            <p class="max-w-prose mx-auto">
              These docs are a major work in progress. They are incomplete and have inaccurate
              information. That is why we need you! Feel free to ask questions in the discord chat
              and if you're dedicated, then contribute!
            </p>{" "}
          </header>
          <Nav />
          <Routes />
        </MDXProvider>
        <Scripts />
      </body>
    </html>
  );
}
