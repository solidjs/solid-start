import { getOwner } from "solid-js";
import { createStore } from "solid-js/store";
import { createComponent, getNextElement, hydrate } from "solid-js/web";

function lookupOwner(el: HTMLElement) {
  const parent = el.closest("solid-children");
  return parent && (parent as any).__$owner;
}

export function mountIslands() {
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

    let Component = window._$HY.islandMap[el.dataset.island];
    if (!Component || !el.dataset.hk) return;

    let hk = el.dataset.hk;
    DEBUG("hydrating island", el.dataset.island, hk.slice(0, hk.length - 1) + `1-`, el);

    el.props = createStore({
      ...JSON.parse(el.dataset.props),
      get children() {
        const el = getNextElement();
        (el as any).__$owner = getOwner();
        return;
      }
    });

    hydrate(() => createComponent(Component, el.props[0]), el, {
      renderId: hk.slice(0, hk.length - 1) + `1-`,
      owner: lookupOwner(el)
    });

    delete el.dataset.hk;
    el.dataset.hkk = hk;
  }

  let queue = [];
  let queued = false;
  function runTaskQueue(info) {
    while (info.timeRemaining() > 0 && queue.length) {
      mountIsland(queue.shift());
    }
    if (queue.length) {
      requestIdleCallback(runTaskQueue);
    } else queued = false;
  }
  window._$HY.hydrateIslands = () => {
    const islands = document.querySelectorAll("solid-island[data-hk]");
    const assets = new Set<string>();
    islands.forEach((el: HTMLElement) => assets.add(el.dataset.component));
    Promise.all([...assets].map(asset => import(/* @vite-ignore */ asset))).then(() => {
      islands.forEach((el: HTMLElement) => {
        if (el.dataset.when === "idle" && "requestIdleCallback" in window) {
          if (!queued) {
            queued = true;
            requestIdleCallback(runTaskQueue);
          }
          queue.push(el);
        } else mountIsland(el as HTMLElement);
      });
    });
  };
  window._$HY.fe = window._$HY.hydrateIslands;
  window._$HY.hydrateIslands();

  window._$HY.replaceIslands = ({
    outlet,
    old,
    new: newEl,
    content,
    next
  }: {
    outlet: HTMLElement;
    new: Document;
    old: HTMLElement;
  }) => {
    const islands = newEl.body.querySelectorAll("solid-island[data-hk]");
    let el = document.activeElement;
    islands.forEach((el: HTMLElement) => {
      let oldIsland = old.querySelector(
        `solid-island[data-hkk="${el.dataset.hk}"][data-component="${el.dataset.component}"]`
      );
      if (oldIsland) {
        console.log("persisted island", el.dataset.hk, el, oldIsland);
        oldIsland.props[1](JSON.parse(el.dataset.props));
        let child = oldIsland.querySelector("solid-children");
        let newChildren = el.querySelector("solid-children");
        if (child && newChildren) {
          child.replaceWith(newChildren);
        }
        el.parentElement.replaceChild(oldIsland, el);
      }
    });

    outlet.id = next;
    outlet.replaceChildren(...newEl.body.children);
    el.focus();
    window._$HY.hydrateIslands();
  };
}
