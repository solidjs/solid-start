import { diff } from "micromorph";
import { createStore } from "solid-js/store";
import { createComponent, getHydrationKey, getOwner, hydrate } from "solid-js/web";

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
        const p = el.getElementsByTagName("solid-children");
        getHydrationKey();
        console.log(p);
        [...p].forEach(a => {
          (a as any).__$owner = getOwner();
        });
        return;
      }
    });

    hydrate(() => createComponent(Component, el.props[0]), el, {
      renderId: hk.slice(0, hk.length - 1) + `${1 + Number(el.dataset.offset)}-`,
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
  window._$HY.fe = window._$HY.hydrateIslands;
  window._$HY.hydrateIslands();

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

  function patchAttributes(el, patches: any) {
    if (patches.length === 0) return;
    for (const { type, name, value } of patches) {
      if (type === ACTION_REMOVE_ATTR) {
        el.removeAttribute(name);
      } else if (type === ACTION_SET_ATTR) {
        el.setAttribute(name, value);
      }
    }
  }

  function patchIsland(el, { attributes, children }) {
    if (el.tagName === "SOLID-ISLAND") {
      console.log("persisted", el, attributes);
      let props = attributes.find(a => a.name === "data-props");
      if (props) {
        el.props[1](JSON.parse(props.value));
      }

      function patchChildren(el, children) {
        const elements = Array.from(el.childNodes) as Element[];
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.tagName === "SOLID-CHILDREN") {
            const child = children[i];
            patch(el, child, element);
          } else if (element.tagName === "SOLID-ISLAND") {
            const child = children[i];
            patchIsland(element, child);
          } else {
            patchChildren(element, children[i]?.children);
          }
        }
      }

      patchChildren(el, children);
      return;
    }
  }

  async function patch(parent: Node, PATCH: any, child?: Node) {
    if (!PATCH) return;

    let el;
    if (parent.nodeType === NODE_TYPE_DOCUMENT) {
      parent = (parent as Document).documentElement;
      el = parent;
    } else if (!child) {
      el = parent;
    } else {
      el = child;
    }

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
        patchIsland(el, { attributes, children });
        patchAttributes(el, attributes);
        // Freeze childNodes before mutating
        const elements = Array.from(el.childNodes) as Element[];
        await Promise.all(children.map((child, index) => patch(el, child, elements[index])));
        return;
      }
    }
  }

  window._$HY.replaceIslands = ({ outlet, new: newEl }: { outlet: HTMLElement; new: Document }) => {
    let d = diff(outlet, newEl);
    patch(outlet, d);
    // const islands = newEl.body.querySelectorAll("solid-island[data-hk]");
    // let el = document.activeElement;
    // islands.forEach((el: HTMLElement) => {
    //   let oldIsland = old.querySelector(
    //     `solid-island[data-hkk="${el.dataset.hk}"][data-component="${el.dataset.component}"]`
    //   );
    //   if (oldIsland) {
    //     console.log("persisted island", el.dataset.hk, el, oldIsland);
    //     oldIsland.props[1](JSON.parse(el.dataset.props));
    //     let child = oldIsland.querySelector("solid-children");
    //     let newChildren = el.querySelector("solid-children");
    //     if (child && newChildren) {
    //       child.replaceWith(newChildren);
    //     }
    //     el.parentElement.replaceChild(oldIsland, el);
    //   }
    // });

    // outlet.id = next;
    // outlet.replaceChildren(...newEl.body.children);
    // el.focus();
    window._$HY.hydrateIslands();
  };
}
