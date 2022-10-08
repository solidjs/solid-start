// @refresh reload
import { createMemo, createUniqueId, For, mergeProps, Show, Suspense } from "solid-js";
import { MDXProvider } from "solid-mdx";
import {
  A,
  Body,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
  unstable_island
} from "solid-start";
import { ErrorBoundary } from "solid-start/error-boundary";
import "./docs/index.css";

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
    <nav class="min-w-[180px] px-8 py-8 space-y-4 h-screen overflow-scroll">
      <For each={data()}>
        {r => (
          <ul>
            <span class="font-bold text-lg mb-4">{r.title}</span>
            <Show
              when={!r.subsection}
              fallback={
                <>
                  <For each={[...r.subsection.values()]}>
                    {s => (
                      <ul class="ml-2 mt-3">
                        <span class="font-bold text-gray-400 text-md mb-4">{s}</span>
                        <For each={r.filter(i => i.subsection === s)}>
                          {({ title, path, href }) => (
                            <li class="ml-2">
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
                    {({ title, path, href }) => (
                      <li class="ml-2">
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
                {({ title, path, href }) => (
                  <li class="ml-2">
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

const headerBolxd = "text-solid-default dark:text-solid-darkdefault ";

const components = {
  strong: props => <span class="font-bold">{props.children}</span>,
  h1: props => (
    <h1 {...props}>
      <Title>{props.children}</Title>
      {props.children}
    </h1>
  ),
  ssr: props => <>{props.children}</>,
  spa: props => <></>,
  p: props => <p {...props}>{props.children}</p>,
  a: props => {
    return (
      <A
        {...props}
        class="dark:text-link-dark break-normal border-b border-solid-default border-opacity-0 hover:border-opacity-100 duration-100 ease-in transition font-semibold leading-normal"
      >
        {props.children}
      </A>
    );
  },
  li: props => (
    <li {...props} class="mb-2">
      {props.children}
    </li>
  ),
  ul: props => (
    <ul {...props} class="list-disc pl-8 mb-2">
      {props.children}
    </ul>
  ),
  ol: props => (
    <ol {...props} class="list-decimal pl-8 mb-2">
      {props.children}
    </ol>
  ),
  nav: props => <nav {...props}>{props.children}</nav>,
  A,
  code: props => {
    return (
      <code className="inline text-code font-mono" {...props}>
        {props.children}
      </code>
    );
  },
  pre: props => (
    <>
      {/* <Show when={props.filename?.length > 5}>
        <span {...props} class="h-4 p-1">
          {props.filename}
        </span>
      </Show> */}
      <pre
        {...mergeProps(props, {
          get class() {
            return props.className + " " + (props.bad ? "border-red-400 border-1" : "");
          },
          get className() {
            return undefined;
          }
        })}
      >
        {props.children}
      </pre>
    </>
  ),
  "data-lsp": props => {
    const id = createUniqueId();
    // createEffect(() => {
    //   tippy(`[data-template="${id}"]`, {
    //     content() {
    //       const template = document.getElementById(id);
    //       return template.innerHTML;
    //     },
    //     allowHTML: true
    //   });
    // });
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
  }
};

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - With MDX</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <div class="flex flex-row justify-around">
          <Nav />
          <div class="px-8 py-8 h-screen overflow-scroll xl:w-[65ch]">
            <ErrorBoundary>
              <Suspense>
                <main class="prose prose-sm max-w-none w-full">
                  <MDXProvider components={components}>
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
        <Scripts />
      </Body>
    </Html>
  );
}
