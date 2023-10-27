import { diff, Patch } from "micromorph";
import { createStore } from "solid-js/store";
import { createComponent, getHydrationKey, getOwner, hydrate } from "solid-js/web";

export function hydrateServerRouter() {
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

    let Component = window._$HY.islandMap[el.dataset.island!];
    if (!Component || !el.dataset.hk) return;

    let hk = el.dataset.hk;
    _$DEBUG("hydrating island", el.dataset.island, hk.slice(0, hk.length - 1) + `1-`, el);

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
    islands.forEach((el: HTMLElement) => el.dataset.component && assets.add(el.dataset.component));
    Promise.all([...assets].map(asset => import(/* @vite-ignore */ asset)))
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

  // Node Types
  const NODE_TYPE_ELEMENT = 1;
  const NODE_TYPE_TEXT = 3;
  const NODE_TYPE_COMMENT = 8;
  const NODE_TYPE_DOCUMENT = 9;

  // Actions
  const ACTION_CREATE = 0;
  const ACTION_REMOVE = 1;
  const ACTION_REPLACE = 2;
  const ACTION_UPDATE = 3;
  const ACTION_SET_ATTR = 4;
  const ACTION_REMOVE_ATTR = 5;

  function patchAttributes(el: HTMLElement, patches: Patch[]) {
    if (patches.length === 0) return;
    for (const { type, name, value } of patches) {
      if (type === ACTION_REMOVE_ATTR) {
        el.removeAttribute(name);
      } else if (type === ACTION_SET_ATTR) {
        el.setAttribute(name, value);
      }
    }
  }

  function patchIsland(el: HTMLElement, { attributes, children }: Patch) {
    if (el.tagName === "SOLID-ISLAND") {
      let props = attributes.find((a: { name: string }) => a.name === "data-props");
      if (props) {
        map.get(el)[1](JSON.parse(props.value));
      }

      function patchChildren(el: HTMLElement, children: Patch["children"]) {
        const elements = Array.from(el.childNodes) as Element[];
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.tagName === "SOLID-CHILDREN") {
            const child = children[i];
            patch(el, child, element);
          } else if (element.tagName === "SOLID-ISLAND") {
            const child = children[i];
            patchIsland(element as HTMLElement, child);
          } else {
            patchChildren(element as HTMLElement, children[i]?.children);
          }
        }
      }

      patchChildren(el, children);
      return true;
    }
    return false;
  }

  async function patch(parent: Node, PATCH: any, child?: Node) {
    if (!PATCH) return;

    let _el: HTMLElement | Node | null = null;
    if (parent.nodeType === NODE_TYPE_DOCUMENT) {
      parent = (parent as Document).documentElement;
      _el = parent;
    } else if (!child) {
      _el = parent;
    } else {
      _el = child;
    }

    let el = _el as HTMLElement;

    switch (PATCH.type) {
      case ACTION_CREATE: {
        const { node } = PATCH;
        parent.appendChild(node);
        return;
      }
      case ACTION_REMOVE: {
        if (!el) return;
        parent.removeChild(el);
        return;
      }
      case ACTION_REPLACE: {
        if (!el) return;
        const { node, value } = PATCH;
        if (typeof value === "string") {
          el.nodeValue = value;
          return;
        }
        el.replaceWith(node);
        return;
      }
      case ACTION_UPDATE: {
        if (!el) return;
        const { attributes, children } = PATCH;
        if (el.tagName === "SOLID-ISLAND") {
          return patchIsland(el, { type: ACTION_UPDATE, attributes, children });
        }

        patchAttributes(el, attributes);
        // Freeze childNodes before mutating
        const elements = Array.from(el.childNodes) as Element[];
        await Promise.all(
          children.map((child: Patch, index: number) => patch(el, child, elements[index]))
        );
        return;
      }
    }
  }

  async function swap(prev: HTMLElement, next: HTMLElement) {
    const newIslands = next.querySelectorAll<HTMLElement>("solid-island[data-hk]");
    let el = document.activeElement as HTMLElement;
    newIslands.forEach((el: HTMLElement) => {
      let oldIsland: null | (HTMLElement & { props: any }) = prev.querySelector(
        `solid-island[data-hkk="${el.dataset.hk}"][data-component="${el.dataset.component}"]`
      );
      if (oldIsland) {
        console.log("persisted island", el.dataset.hk, el, oldIsland);
        oldIsland.props[1](JSON.parse(el.dataset.props ?? "{}"));
        let child = oldIsland.querySelector("solid-children");
        let newChildren = el.querySelector("solid-children");
        if (child && newChildren) {
          child.replaceWith(newChildren);
        }

        if (el.parentElement) {
          el.parentElement.replaceChild(oldIsland, el);
        }
      }
    });

    prev.id = next.id;
    prev.replaceChildren(...next.children);
    el?.focus?.();
  }

  const replace = async (prev: HTMLElement, next: HTMLElement) => {
    await patch(prev, diff(prev, next));
    hydrateIslands();
    return true;
  };

  window._$HY.fe = hydrateIslands;
  window._$HY.morph = replace;
  hydrateIslands();
}
