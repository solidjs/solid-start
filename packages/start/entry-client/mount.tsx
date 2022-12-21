import type { JSX } from "solid-js";
import { getOwner } from "solid-js";
import { createComponent, getNextElement, hydrate, render } from "solid-js/web";

import mountRouter from "../islands/router";

declare global {
  interface Window {
    INSPECT: () => void;
  }
}

if (import.meta.env.DEV) {
  localStorage.setItem("debug", import.meta.env.DEBUG ?? "start*");
  // const { default: createDebugger } = await import("debug");
  // window._$DEBUG = createDebugger("start:client");
  window._$DEBUG = console.log as unknown as any;

  _$DEBUG(`import.meta.env.DEV = ${import.meta.env.DEV}`);
  _$DEBUG(`import.meta.env.PROD = ${import.meta.env.PROD}`);
  _$DEBUG(`import.meta.env.START_SSR = ${import.meta.env.START_SSR}`);
  _$DEBUG(`import.meta.env.START_ISLANDS = ${import.meta.env.START_ISLANDS}`);
  _$DEBUG(`import.meta.env.START_ISLANDS_ROUTER = ${import.meta.env.START_ISLANDS_ROUTER}`);
  _$DEBUG(`import.meta.env.SSR = ${import.meta.env.SSR}`);

  window.INSPECT = () => {
    window.open(window.location.href.replace(window.location.pathname, "/__inspect"));
  };
}

function lookupOwner(el: HTMLElement) {
  const parent = el.closest("solid-children");
  return parent && (parent as any).__$owner;
}

export default function mount(code?: () => JSX.Element, element?: Document) {
  if (import.meta.env.START_ISLANDS) {
    mountRouter();

    async function mountIsland(el: HTMLElement) {
      let Component = el.dataset.island && window._$HY.islandMap[el.dataset.island];
      if (!Component || !el.dataset.hk) return;
      _$DEBUG(
        "hydrating island",
        el.dataset.island,
        el.dataset.hk.slice(0, el.dataset.hk.length - 1) + `1-`,
        el
      );

      hydrate(
        () =>
          !Component || typeof Component === "string"
            ? Component
            : createComponent(Component, {
                ...JSON.parse(el.dataset.props || "undefined"),
                get children() {
                  const el = getNextElement();
                  (el as any).__$owner = getOwner();
                  return;
                }
              }),
        el,
        {
          renderId: el.dataset.hk.slice(0, el.dataset.hk.length - 1) + `1-`,
          owner: lookupOwner(el)
        }
      );

      delete el.dataset.hk;
    }

    let queue: HTMLElement[] = [];
    let queued = false;
    function runTaskQueue(info: { timeRemaining(): number }) {
      while (info.timeRemaining() > 0 && queue.length) {
        mountIsland(queue.shift() as HTMLElement);
      }
      if (queue.length) {
        requestIdleCallback(runTaskQueue);
      } else queued = false;
    }
    window._$HY.hydrateIslands = () => {
      const islands = document.querySelectorAll("solid-island[data-hk]");
      const assets = new Set<string>();
      islands.forEach((el: Element) => assets.add((el as HTMLElement).dataset.component || ""));
      Promise.all([...assets].map(asset => import(/* @vite-ignore */ asset))).then(() => {
        islands.forEach((el: Element) => {
          if ((el as HTMLElement).dataset.when === "idle" && "requestIdleCallback" in window) {
            if (!queued) {
              queued = true;
              requestIdleCallback(runTaskQueue);
            }
            queue.push(el as HTMLElement);
          } else mountIsland(el as HTMLElement);
        });
      });
    };
    window._$HY.fe = window._$HY.hydrateIslands;

    window._$HY.hydrateIslands();

    return;
  } else if (import.meta.env.START_ISLANDS_ROUTER) {
    mountRouter();
    return;
  }

  if (import.meta.env.START_SSR) {
    code && element && hydrate(code, element);
  } else {
    code && element && render(code, element === document ? element.body : element);
  }
}
