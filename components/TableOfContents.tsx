import { For, Suspense } from "solid-js";
import { useLocation } from "solid-start";
import { createServerData } from "solid-start/server";
import { mods } from "../root.docs";

export default function TableOfContents() {
  const path = useLocation();
  const data = createServerData(
    () => path.pathname,
    async pathname => {
      let mod = mods[`./docs${pathname}.mdx`] ?? mods[`./docs${pathname}.md`];
      return mod.getHeadings().filter(h => h.depth > 1 && h.depth <= 3);
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
                <a href={`#${h.slug}`}>{h.text}</a>
              </li>
            )}
          </For>
        </Suspense>
      </ul>
    </div>
  );
}
