// @refresh reload
import { Links, Meta, Routes, Scripts } from "solid-start/root";

import "./code.css";
import "virtual:windi.css";

import { MDXProvider } from "solid-mdx";
import Nav from "./components/Nav";
import md from "./md";
import { createEffect } from "solid-js";
import tippy from "tippy.js";
import { Main } from "./components/Main";
import { createStore } from "solid-js/store";

export const [store, setStore] = createStore({
  darkMode: false
});

export default function Root() {
  createEffect(() => {
    // setTimeout(() => {
    //   tippy("[data-template]", {
    //     content(reference) {
    //       const id = reference.getAttribute("data-template");
    //       const template = document.getElementById(id);
    //       return template.innerHTML;
    //     },
    //     allowHTML: true
    //   });
    // }, 50);

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
      setStore("darkMode", true);
    } else {
      document.documentElement.classList.add("light");
      setStore("darkMode", false);
    }
  });
  return (
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@200;300;400&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body class="font-sans antialiased text-lg bg-wash dark:bg-wash-dark text-secondary dark:text-secondary-dark leading-base min-h-screen h-auto lg:h-screen flex flex-row">
        <MDXProvider
          components={{
            ...md
          }}
        >
          <Nav />
          <Main>
            <Routes />
          </Main>
          {/* <div class="h-screen overflow-scroll flex-1 bg-blue-50 px-12">
            <div class="flex flex-col w-full"> <Routes /> </div>
          </div> */}
        </MDXProvider>
        <Scripts />
      </body>
    </html>
  );
}

import { useParams, Router, Route } from "solid-app-router";
import { createResource, JSX } from "solid-js";

function App() {
  return (
    <Router>
      <Route path="/user/:id" component={User} />
    </Router>
  );
}

function fetchUser(id: string) {
  return { name: "John" };
}

// ---cut---
function User() {
  const params = useParams();

  // fetch user based on the id that we get as a path parameter
  const [user] = createResource(() => params.slug, fetchUser);

  return <h1>{user().name}</h1>;
}
