import { For, Suspense } from "solid-js";
import { A, useLocation } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { mods } from "../docs.root";

export function useTableOfContents() {
  const path = useLocation();
  return createServerData$(
    async pathname => {
      let mod = mods[`./docs${pathname}.mdx`] ?? mods[`./docs${pathname}.md`];
      if (!mod) return [];
      return mod.getHeadings().filter(h => h.depth > 1 && h.depth <= 3);
    },
    {
      key: () => path.pathname
    }
  );
}

export default function TableOfContents() {
  const headings = useTableOfContents();

  return (
    <div class="hidden col-start-3 row-start-2 xl:block px-8 py-8 space-y-4 w-[240px] overflow-hidden">
      <span class="font-bold uppercase text-xs">On this page</span>
      <ul class="space-y-4 text-sm">
        <Suspense>
          <For each={headings()}>
            {h => (
              <li
                classList={{
                  "ml-2 font-semibold text-gray-500": h.depth === 2,
                  "ml-4 text-gray-400": h.depth === 3
                }}
              >
                <A activeClass="text-blue-400" href={`#${h.slug}`}>
                  {h.text}
                </A>
              </li>
            )}
          </For>
        </Suspense>
      </ul>
    </div>
  );
}
