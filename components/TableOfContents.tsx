import { For, Suspense } from "solid-js";
import { A, useLocation } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { mods } from "../docs.root";

export default function TableOfContents() {
  const path = useLocation();
  const data = createServerData$(
    async pathname => {
      let mod = mods[`./docs${pathname}.mdx`] ?? mods[`./docs${pathname}.md`];
      if (!mod) return [];
      return mod.getHeadings().filter(h => h.depth > 1 && h.depth <= 3);
    },
    {
      key: () => path.pathname
    }
  );

  return (
    <div class="hidden xl:block px-8 py-8 space-y-4 w-[240px] overflow-hidden">
      <span class="font-bold uppercase text-xs">On this page</span>
      <ul class="space-y-2 text-sm">
        <Suspense>
          <For each={data()}>
            {h => (
              <li
                classList={{
                  "ml-2": h.depth === 2,
                  "ml-4": h.depth === 3
                }}
              >
                <A href={`#${h.slug}`}>{h.text}</A>
              </li>
            )}
          </For>
        </Suspense>
      </ul>
    </div>
  );
}
