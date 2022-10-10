// @refresh reload
import { createMemo, For, Show, Suspense } from "solid-js";
import { MDXProvider } from "solid-mdx";
import {
  Body,
  FileRoutes,
  Head,
  Html,
  Link,
  Meta,
  Routes,
  Scripts,
  Stylesheet,
  Title,
  unstable_island
} from "solid-start";
import { ErrorBoundary } from "solid-start/error-boundary";
import "./components/index.css";

const IslandA = unstable_island(() => import("./components/A"));
const TableOfContents = unstable_island(() => import("./components/TableOfContents"));

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
>("./docs/**/*.{md,mdx}", {
  eager: true,
  query: {
    meta: ""
  }
});

function Nav() {
  const data = createMemo(() => {
    let sections: {
      [key: string]: {
        title: string;
        path: string;
        order: number;
        subsection: string;
        href: string;
      }[] & { subsection?: Set<string>; title?: string; order?: number };
    } = {};
    Object.keys(mods).forEach(key => {
      let frontMatter = mods[key].getFrontMatter();
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
        href: key.slice(6).replace(/\.mdx?$/, "")
      });
    });

    Object.keys(sections).forEach(key => {
      sections[key].sort((a, b) => a.order - b.order);
    });

    return Object.values(sections).sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  });

  return (
    <nav class="min-w-[180px] px-8 py-8 space-y-4 h-screen md:block hidden overflow-scroll bg-slate-100">
      <div id="docsearch" />
      <For each={data()}>
        {r => (
          <ul>
            <span class="text-left w-full dark:text-white border-b border-gray-200 dark:border-gray-500 hover:text-gray-400 transition flex flex-wrap content-center justify-between space-x-2 text-xl p-2 py-2 mb-8">
              {r.title}
            </span>
            <Show
              when={!r.subsection}
              fallback={
                <>
                  <For each={[...r.subsection.values()]}>
                    {s => (
                      <ul class="ml-2 mt-3">
                        <span class="font-bold text-gray-400 text-md mb-4">{s}</span>
                        <For each={r.filter(i => i.subsection === s)}>
                          {({ title, path, href, frontMatter }) => (
                            <li class="ml-2" classList={{ "text-slate-300": !frontMatter.active }}>
                              <IslandA activeClass="text-blue-700" href={href}>
                                <span>{title}</span>
                              </IslandA>
                            </li>
                          )}
                        </For>
                      </ul>
                    )}
                  </For>
                  <For each={r.filter(i => !i.subsection)}>
                    {({ title, path, href, frontMatter }) => (
                      <li class="ml-2" classList={{ "text-slate-300": !frontMatter.active }}>
                        <IslandA activeClass="text-blue-700" href={href}>
                          <span>{title}</span>
                        </IslandA>
                      </li>
                    )}
                  </For>
                </>
              }
            >
              <For each={r}>
                {({ title, path, href, frontMatter }) => (
                  <li class="ml-2" classList={{ "text-slate-300": !frontMatter.active }}>
                    <IslandA activeClass="text-blue-700" href={href}>
                      <span>{title}</span>
                    </IslandA>
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
    <Html lang="en">
      <Head>
        <Title>SolidStart</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Link rel="icon" href="/favicon.ico" />
        <Stylesheet href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />
      </Head>
      <Body>
        <div class="flex md:flex-row flex-col justify-around">
          <Nav />
          <div class="px-8 py-8 h-screen overflow-scroll xl:w-[65ch]">
            <ErrorBoundary>
              <Suspense>
                <main class="prose prose-sm max-w-none w-full">
                  <MDXProvider
                    components={{
                      ...components,
                      "table-of-contents": () => {
                        const headings = useTableOfContents();

                        return (
                          <>
                            <div class="xl:hidden space-y-4 overflow-hidden">
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
                                        <IslandA class="border-0 no-underline" href={`#${h.slug}`}>
                                          {h.text}
                                        </IslandA>
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
                    <Routes>
                      <FileRoutes />
                    </Routes>
                  </MDXProvider>
                </main>
              </Suspense>
            </ErrorBoundary>
          </div>
          <TableOfContents />
        </div>
        <script src="https://cdn.jsdelivr.net/npm/@docsearch/js@3"></script>
        <script>
          {`docsearch({
            appId: "VTVVKZ36GX",
            apiKey: "f520312c8dccf1309453764ee2fed27e",
            indexName: "solidjs",
            container: "#docsearch",
            debug: false 
          });`}
        </script>
        <Scripts />
      </Body>
    </Html>
  );
}
