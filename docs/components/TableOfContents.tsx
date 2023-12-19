import { A, useLocation } from "@solidjs/router";
import { For, Suspense, createResource } from "solid-js";
import { mods } from "../app";

export function useTableOfContents() {
  const path = useLocation();
  const [table] = createResource(
    () => path.pathname,
    async pathname => {
      let mod = mods[`./routes${pathname}.mdx`] ?? mods[`./routes${pathname}.md`];
      if (!mod) return [];
      return mod.getHeadings().filter(h => h.depth > 1 && h.depth <= 3);
    }
  );
  return table;
}

export function TableOfContents() {
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
