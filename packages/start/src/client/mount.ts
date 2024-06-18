import type { JSX } from "solid-js";
import { createStore } from "solid-js/store";
import {
  createComponent,
  getHydrationKey,
  getOwner,
  hydrate,
  type MountableElement
} from "solid-js/web";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/client/mount
 */
export function mount(fn: () => JSX.Element, el: MountableElement) {
  if (import.meta.env.START_ISLANDS) {
    const map = new WeakMap();
    async function mountIsland(el: HTMLElement) {
      if (el.dataset.css) {
        let css = JSON.parse(el.dataset.css);
        for (let href of css) {
          if (!document.querySelector(`link[href="${href}"]`)) {
            let link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            document.head.appendChild(link);
          }
        }
      }

      let mod = await import(
        /* @vite-ignore */
        import.meta.env.MANIFEST["client"]!.chunks[el.dataset.id!.split("#")[0] as string]!.output
          .path
      );
      if (!mod || !el.dataset.hk) return;

      let Component = mod[el.dataset.id!.split("#")[1] as string];
      let hk = el.dataset.hk;
      // _$DEBUG("hydrating island", el.dataset.island, hk.slice(0, hk.length - 1) + `1-`, el);

      let props = createStore({
        ...JSON.parse(el.dataset.props!),
        get children() {
          const p = el.getElementsByTagName("solid-children");
          getHydrationKey();
          [...p].forEach(a => {
            (a as any).__$owner = getOwner();
          });
          return;
        }
      });

      map.set(el, props);

      hydrate(() => createComponent(Component, props[0]), el, {
        renderId: hk.slice(0, hk.length - 1) + `${1 + Number(el.dataset.offset)}-`,
        owner: lookupOwner(el)
      });

      delete el.dataset.hk;
      el.dataset.hkk = hk;
    }

    let queue: HTMLElement[] = [];
    let queued = false;
    function runTaskQueue(info: any) {
      while (info.timeRemaining() > 0 && queue.length) {
        mountIsland(queue.shift()!);
      }
      if (queue.length) {
        requestIdleCallback(runTaskQueue);
      } else queued = false;
    }

    const hydrateIslands = () => {
      const islands: NodeListOf<HTMLElement> = document.querySelectorAll("solid-island[data-hk]");
      const assets = new Set<string>();
      islands.forEach((el: HTMLElement) => el.dataset.id && assets.add(el.dataset.id));
      Promise.all(
        [...assets].map(
          asset =>
            import(
              /* @vite-ignore */ import.meta.env.MANIFEST["client"]!.chunks[
                asset.split("#")[0] as string
              ]!.output.path
            )
        )
      )
        .then(() => {
          islands.forEach((el: HTMLElement) => {
            if (el.dataset.when === "idle" && "requestIdleCallback" in window) {
              if (!queued) {
                queued = true;
                requestIdleCallback(runTaskQueue);
              }
              queue.push(el);
            } else mountIsland(el as HTMLElement);
          });
        })
        .catch(e => console.error(e));
    };

    function lookupOwner(el: HTMLElement) {
      const parent = el.closest("solid-children");
      return parent && (parent as any).__$owner;
    }

    hydrateIslands();

    return;
  }
  return hydrate(fn, el);
}
