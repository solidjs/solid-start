// @refresh reload
import { createMemo, For, Suspense } from "solid-js";
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
            <span class="font-bold mb-4">{r.title}</span>
            <For each={r}>
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
    </nav>
  );
}

function TableOfContents() {
  const path = useLocation();
  const mod = () => mods[`./docs${path.pathname}.mdx`];
  return (
    <div class="hidden xl:block px-8 py-8 space-y-4">
      <span class="font-bold uppercase text-xs">On this page</span>
      <ul class="space-y-2 text-sm">
        <For each={mod().getHeadings()}>
          {h => (
            <li>
              <a href={`#${h.slug}`}>{h.text}</a>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

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
                  <Routes>
                    <FileRoutes />
                  </Routes>
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
