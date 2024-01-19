// @refresh reload
import { MetaProvider, Title } from "@solidjs/meta";
import { A, Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start";
import { createMemo, For, Show, Suspense } from "solid-js";
import { MDXProvider } from "solid-mdx";
import "./components/index.css";

export const mods = /*#__PURE__*/ import.meta.glob<
  true,
  any,
  {
    getHeadings: () => {
      depth: number;
      text: string;
      slug: string;
    }[];
    getFrontMatter: () => {
      title?: string;
      sectionTitle?: string;
      order?: number;
      section?: string;
      sectionOrder?: number;
      subsection?: string;
    };
  }
>("./routes/**/*.{md,mdx}", {
  eager: true,
  query: {
    pick: "getFrontMatter"
  }
});

const socials = [
  {
    href: "https://github.com/solidjs/solid-start",
    alt: "GitHub",
    icon: "M12 .3a12 12 0 00-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 016 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 011.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0012 .3"
  },

  {
    href: "https://www.reddit.com/r/solidjs/",
    alt: "Reddit",
    icon: "M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.74c.69 0 1.25.56 1.25 1.25a1.25 1.25 0 01-2.5.06l-2.6-.55-.8 3.75c1.83.07 3.48.63 4.68 1.49.3-.31.73-.5 1.2-.5.97 0 1.76.8 1.76 1.76 0 .72-.43 1.33-1.01 1.61a3.11 3.11 0 01.04.52c0 2.7-3.13 4.87-7 4.87-3.88 0-7-2.17-7-4.87 0-.18 0-.36.04-.53A1.75 1.75 0 014.03 12a1.75 1.75 0 012.96-1.26 8.52 8.52 0 014.74-1.5l.89-4.17a.34.34 0 01.14-.2.35.35 0 01.24-.04l2.9.62a1.21 1.21 0 011.11-.7zM9.25 12a1.25 1.25 0 101.25 1.25c0-.69-.56-1.25-1.25-1.25zm5.5 0a1.25 1.25 0 000 2.5 1.25 1.25 0 000-2.5zm-5.47 3.99a.33.33 0 00-.23.1.33.33 0 000 .46c.84.84 2.49.91 2.96.91.48 0 2.1-.06 2.96-.91a.36.36 0 00.03-.47.33.33 0 00-.46 0c-.55.54-1.68.73-2.51.73-.83 0-1.98-.2-2.51-.73a.33.33 0 00-.24-.1z"
  },

  {
    href: "https://discord.com/invite/solidjs",
    alt: "Discord",
    icon: "M12 0C5.3 0 0 5.3 0 12s5.3 12 12 12 12-5.4 12-12S18.6 0 12 0zM9.7 5.9a.05.05 0 0 1 .06.03 8.43 8.43 0 0 1 .41.83 12.2 12.2 0 0 1 3.66 0 9.19 9.19 0 0 1 .4-.83.05.05 0 0 1 .06-.03 13.2 13.2 0 0 1 3.26 1.01.04.04 0 0 1 .02.02c1.8 2.66 2.7 5.66 2.37 9.11a.05.05 0 0 1-.02.04 13.24 13.24 0 0 1-4 2.02.05.05 0 0 1-.06-.02 10.65 10.65 0 0 1-.82-1.33.05.05 0 0 1 .02-.07 8.2 8.2 0 0 0 1.25-.6.05.05 0 0 0 .01-.08 6.47 6.47 0 0 1-.25-.2.05.05 0 0 0-.05 0 9.47 9.47 0 0 1-8.05 0 .05.05 0 0 0-.05 0l-.25.2a.05.05 0 0 0 0 .08 8.75 8.75 0 0 0 1.26.6.05.05 0 0 1 .02.07 9.48 9.48 0 0 1-.82 1.33.05.05 0 0 1-.05.02 13.28 13.28 0 0 1-4-2.02.05.05 0 0 1-.02-.04c-.28-2.99.29-6.01 2.37-9.11a.05.05 0 0 1 .02-.02A13.17 13.17 0 0 1 9.7 5.9zM9.35 11c-.8 0-1.43.72-1.43 1.6 0 .9.64 1.62 1.43 1.62.8 0 1.44-.72 1.44-1.61.02-.88-.63-1.61-1.44-1.61zm5.33 0c-.8 0-1.44.72-1.44 1.6 0 .9.65 1.62 1.44 1.62.8 0 1.43-.72 1.43-1.61.02-.88-.63-1.61-1.43-1.61z"
  },

  {
    href: "https://twitter.com/solid_js",
    alt: "Twitter",
    icon: "M12,0.1c-6.7,0-12,5.3-12,12s5.3,12,12,12s12-5.4,12-12S18.6,0.1,12,0.1z M17,9.4v0.4c0,3.8-2.6,8-7.5,8 c-1.5,0-2.9-0.5-4.1-1.3c0.2,0,0.4,0,0.7,0c1.2,0,2.3-0.5,3.3-1.2c-1.1,0-2.1-0.8-2.4-2c0.2,0.1,0.3,0.1,0.5,0.1 c0.2,0,0.5-0.1,0.7-0.1C6.9,13,6,11.9,6,10.5v-0.1c0.3,0.2,0.8,0.4,1.2,0.4c-0.7-0.5-1.2-1.4-1.2-2.3c0-0.5,0.1-1.1,0.3-1.4 c1.3,1.7,3.2,2.8,5.4,2.9c-0.1-0.2-0.1-0.4-0.1-0.6c0-1.6,1.2-2.8,2.7-2.8c0.8,0,1.4,0.3,1.9,0.9C17,7.3,17.6,7,18.1,6.7 c-0.2,0.7-0.6,1.2-1.1,1.6c0.5-0.1,1-0.2,1.5-0.4C18.1,8.4,17.6,8.9,17,9.4z"
  }
];

function SocialIcon(props) {
  return (
    <li class="mx-1.5">
      <a href={props.href} rel="noopener" target="_blank">
        <span class="sr-only">{props.alt}</span>
        <svg viewBox="0 0 24 24" class="h-6 transition hover:opacity-80 opacity-40">
          <path fill="currentColor" d={props.icon} />
        </svg>
      </a>
    </li>
  );
}

function Header() {
  return (
    <header class="relative z-10 col-span-3 col-start-1 row-start-1 flex px-8 py-2 shadow-md shadow-gray-100 md:z-50">
      <div class="flex w-full justify-between">
        <a href="/">
          <div class="flex space-x-3 translate-y-[-2px]">
            <img src="/logo.svg" class="h-9 w-9 scale-[0.94] translate-y-[2px] translate-x-[4px]" />
            <div class="mt-2 hidden text-xl uppercase md:block -translate-y-[1px]">
              <span class="tracking-wide">Solid</span>
              <span class="text-solid-medium ml-1.5 font-semibold tracking-wide">Start</span>
            </div>
          </div>
        </a>
        <div class="flex space-x-5">
          <div class="flex items-center">
            <a
              href="https://www.solidjs.com"
              target="_blank"
              class="flex items-center space-x-5 hover:text-sky-700"
            >
              solidjs.com
              <svg
                class="z-50 -mt-1 h-5 opacity-30 ltr:ml-1 rtl:mr-1 scale-75"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
          <ul class="flex items-center">
            <For each={socials} children={social => <SocialIcon {...social} />} />
          </ul>
        </div>
      </div>
    </header>
  );
}

function Nav() {
  const data = createMemo(() => {
    let sections: {
      [key: string]: {
        title: string;
        path: string;
        order: number;
        subsection: string;
        href: string;
        frontMatter: any;
      }[] & { subsection?: Set<string>; title?: string; order?: number };
    } = {};

    Object.keys(mods).forEach(key => {
      let frontMatter = mods[key];
      let {
        title = mods[key].getHeadings().find(h => h.depth === 1)?.text ?? "",
        section = "",
        order = 100
      } = frontMatter ?? {};
      if (!sections[section]) {
        sections[section] = [];
      }

      if (frontMatter?.subsection) {
        if (!sections[section].subsection) {
          sections[section].subsection = new Set();
        }
        sections[section].subsection.add(frontMatter.subsection);
      }

      if (frontMatter?.sectionTitle) {
        sections[section].title = frontMatter.sectionTitle;
      }

      if (frontMatter?.sectionOrder) {
        sections[section].order = frontMatter.sectionOrder;
      }

      sections[section].push({
        title,
        path: key,
        order,
        frontMatter: frontMatter,
        subsection: frontMatter?.subsection,
        href: key.slice(`./routes`.length).replace(/\.mdx?$/, "")
      });
    });

    Object.keys(sections).forEach(key => {
      sections[key].sort((a, b) => a.order - b.order);
    });

    return Object.values(sections).sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  });

  return (
    <nav class="fixed left-0 top-[52px] z-20 col-start-1 row-start-2 h-full min-w-[300px] -translate-x-full space-y-4 overflow-auto bg-slate-100 px-8 pb-20 pt-8 duration-300 ease-in-out peer-checked:translate-x-0 md:relative md:left-auto md:top-auto md:translate-x-0 md:pb-8">
      <div id="docsearch" style="height: 30px" />
      <For each={data()}>
        {r => (
          <ul class="first:pt-10-">
            <span class="mb-3.5 pt-8 pb-3.5 flex w-full flex-wrap content-center justify-between space-x-2 border-b border-gray-200 p-2 py-2 text-left text-xl transition dark:border-gray-500 dark:text-white">
              {r.title}
            </span>
            <Show
              when={!r.subsection}
              fallback={
                <>
                  <For each={[...r.subsection.values()]}>
                    {s => (
                      <ul class="ml-2 mt-4">
                        <div class="text-md mb-3 font-semibold text-gray-500 pt-1">{s}</div>
                        <For each={r.filter(i => i.subsection === s)}>
                          {({ title, path, href, frontMatter }) => (
                            <li class="ml-2">
                              <A
                                activeClass="text-primary"
                                inactiveClass="text-gray-500"
                                href={href}
                              >
                                <span class="ml-4 block break-words pb-2 text-sm hover:text-slate-700 dark:hover:text-gray-300 hover:underline">
                                  {title}
                                </span>
                              </A>
                            </li>
                          )}
                        </For>
                      </ul>
                    )}
                  </For>

                  <For each={r.filter(i => !i.subsection)}>
                    {({ title, path, href, frontMatter }) => (
                      <li class="ml-2">
                        <A activeClass="text-primary" inactiveClass="text-gray-500" href={href}>
                          <span>{title}</span>
                        </A>
                      </li>
                    )}
                  </For>
                </>
              }
            >
              <For each={r.filter(i => !i.href.includes("index"))}>
                {({ title, path, href, frontMatter }) => (
                  <li class="ml-2" classList={{ "text-slate-300": !frontMatter.active }}>
                    <A activeClass="text-primary" inactiveClass="text-gray-500" href={href}>
                      <span class="text-md block break-words py-1 font-medium pl-1.5 hover:text-slate-700 hover:underline dark:text-gray-300 dark:hover:text-slate-400">
                        {title}
                      </span>
                    </A>
                  </li>
                )}
              </For>
            </Show>
          </ul>
        )}
      </For>
    </nav>
  );
}

import { components } from "./components/components";
import { useTableOfContents } from "./components/TableOfContents";

export default function Root() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>SolidStart (Beta)</Title>
          <Header />

          <input type="checkbox" class="peer hidden" name="sidebar-toggle" id="sidebar-toggle" />

          <label
            class="bg-solid-medium reveal-delay fixed right-10 top-[86px] cursor-pointer rounded-lg text-white opacity-0 transition ease-out duration-300 peer-checked:rotate-90 md:hidden"
            for="sidebar-toggle"
          >
            <svg class="h-7 w-7" viewBox="0 0 24 24" style="fill: none; stroke: currentcolor;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path>
            </svg>
          </label>

          <Nav />

          <div class="col-start-2 row-start-2 h-full overflow-auto">
            <div class="container h-full px-8 py-8">
              <Suspense>
                <main class="prose prose-md w-full max-w-[69ch] pb-10 pt-0 lg:px-10 mx-auto">
                  <MDXProvider
                    components={{
                      ...components,
                      "table-of-contents": () => {
                        return null;
                        const headings = useTableOfContents();
                        return (
                          <>
                            <div class="space-y-4 overflow-hidden xl:hidden">
                              <ul class="space-y-2 text-[1rem]">
                                <Suspense>
                                  <For each={headings()}>
                                    {h => (
                                      <li
                                        classList={{
                                          "ml-2": h.depth === 2,
                                          "ml-4": h.depth === 3
                                        }}
                                      >
                                        <A class="border-0 no-underline" href={`#${h.slug}`}>
                                          {h.text}
                                        </A>
                                      </li>
                                    )}
                                  </For>
                                </Suspense>
                              </ul>
                            </div>
                            <hr class="xl:hidden" />
                          </>
                        );
                      }
                    }}
                  >
                    {props.children}
                  </MDXProvider>
                </main>
              </Suspense>
            </div>
          </div>
          {/* <TableOfContents /> */}
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
