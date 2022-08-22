// @refresh reload
import { createMemo, For, Show, Suspense } from "solid-js";
import { MDXProvider } from "solid-mdx";
import {
  Body,
  FileRoutes,
  Head,
  Html,
  Meta,
  NavLink,
  Routes,
  Scripts,
  Title,
  useLocation
} from "solid-start";
import { ErrorBoundary } from "solid-start/error-boundary";
import "./docs/index.css";

const mods = import.meta.glob<
  true,
  any,
  {
    getHeadings: () => any;
  }
>("./docs/**/*.{md,mdx}", {
  eager: true,
  query: {
    meta: ""
  }
});

function Nav() {
  const data = createMemo(() => {
    let sections = {};
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

  console.log(data());

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
                              <NavLink activeClass="text-blue-700" href={href}>
                                {title}
                              </NavLink>
                            </li>
                          )}
                        </For>
                      </ul>
                    )}
                  </For>
                  <For each={r.filter(i => !i.subsection)}>
                    {({ title, path, href }) => (
                      <li class="ml-2">
                        <NavLink activeClass="text-blue-700" href={href}>
                          {title}
                        </NavLink>
                      </li>
                    )}
                  </For>
                </>
              }
            >
              <For each={r}>
                {({ title, path, href }) => (
                  <li class="ml-2">
                    <NavLink activeClass="text-blue-700" href={href}>
                      {title}
                    </NavLink>
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

function TableOfContents() {
  const path = useLocation();
  const mod = () => mods[`./docs${path.pathname}.mdx`] ?? mods[`./docs${path.pathname}.md`];
  return (
    <div class="hidden xl:block px-8 py-8 space-y-4 w-[32ch]">
      <span class="font-bold uppercase text-xs">On this page</span>
      <ul class="space-y-2 text-sm">
        <For
          each={mod()
            .getHeadings()
            .filter(h => h.depth > 1 && h.depth <= 3)}
        >
          {h => (
            <li
              classList={{
                "ml-2": h.depth === 2,
                "ml-4": h.depth === 3
              }}
            >
              <a href={`#${h.slug}`}>{h.text}</a>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

import { Title as MetaTitle } from "@solidjs/meta";
import { Link } from "@solidjs/router";
import { createUniqueId, mergeProps, ParentProps } from "solid-js";

function Anchor(props: ParentProps<{ id: string }>) {
  return (
    <a class="hover:underline" href={`#${props.id}`}>
      {props.children}
    </a>
  );
}

const headerBold = "text-solid-default dark:text-solid-darkdefault ";

const components = {
  strong: props => <span class="font-bold">{props.children}</span>,
  h1: props => (
    <h1 {...props} class={headerBold + "break-words leading-tight mdx-heading"}>
      <MetaTitle>{props.children}</MetaTitle>
      {props.children}
    </h1>
  ),
  ssr: props => <>{props.children}</>,
  spa: props => <></>,
  h2: props => {
    return (
      <h2 {...props} class={headerBold + "heading text-3xl leading-10 mt-14 mb-6 mdx-heading"}>
        {props.children}
      </h2>
    );
  },
  h3: props => (
    <h3 {...props} class={headerBold + "heading text-2xl leading-9 mt-14 mb-6 mdx-heading"}>
      {props.children}
    </h3>
  ),
  h4: props => (
    <h4 {...props} class="heading text-xl font-bold leading-9 mt-14 mb-4 mdx-heading">
      {props.children}
    </h4>
  ),
  h5: props => (
    <h5 {...props} class="text-xl leading-9 mt-4 mb-4 font-medium mdx-heading">
      {props.children}
    </h5>
  ),
  h6: props => (
    <h6 {...props} class="text-xl font-400 mdx-heading">
      {props.children}
    </h6>
  ),
  p: props => (
    <p {...props} class="text-lg font-400 my-4">
      {props.children}
    </p>
  ),
  a: props => {
    return (
      <Link
        {...props}
        class="dark:text-link-dark break-normal border-b border-solid-default border-opacity-0 hover:border-opacity-100 duration-100 ease-in transition font-semibold leading-normal"
      >
        {props.children}
      </Link>
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
  Link,
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
                <main class="prose prose-md">
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
