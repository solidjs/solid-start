import { createComponent, JSX } from "solid-js";
import { hydrate, render } from "solid-js/web";

export default function mount(code?: () => JSX.Element, element?: Document) {
  if (import.meta.env.START_MPA) {
    interface LocationEntry {
      path: string;
      state: any;
    }

    const basePath = "/";
    let currentLocation: LocationEntry = getLocation();

    function getLocation(): LocationEntry {
      const { pathname, search, hash } = window.location;
      return {
        path: pathname + search + hash,
        state: history.state
      };
    }

    async function handleAnchorClick(evt: MouseEvent) {
      if (
        evt.defaultPrevented ||
        evt.button !== 0 ||
        evt.metaKey ||
        evt.altKey ||
        evt.ctrlKey ||
        evt.shiftKey
      )
        return;

      const a = evt
        .composedPath()
        .find(el => el instanceof Node && el.nodeName.toUpperCase() === "A") as
        | HTMLAnchorElement
        | SVGAElement
        | undefined;

      if (!a) return;

      const isSvg = a instanceof SVGAElement;
      const href = isSvg ? a.href.baseVal : a.href;
      const target = isSvg ? a.target.baseVal : a.target;
      if (target || (!href && !a.hasAttribute("state"))) return;

      const rel = (a.getAttribute("rel") || "").split(/\s+/);
      if (a.hasAttribute("download") || (rel && rel.includes("external"))) return;

      const url = isSvg ? new URL(href, document.baseURI) : new URL(href);
      if (
        url.origin !== window.location.origin ||
        (basePath && url.pathname && !url.pathname.toLowerCase().startsWith(basePath.toLowerCase()))
      )
        return;

      const to = url.pathname + url.search + url.hash;
      const state = a.getAttribute("state");

      evt.preventDefault();

      const options = {
        resolve: false,
        replace: a.hasAttribute("replace"),
        scroll: !a.hasAttribute("noscroll"),
        state: state && JSON.parse(state)
      };

      if (await navigate(to)) {
        if (options.replace) {
          history.replaceState(options.state, "", to);
        } else {
          history.pushState(options.state, "", to);
        }
        currentLocation = getLocation();
      }
    }

    interface NavigateOptions {
      resolve?: boolean;
      replace?: boolean;
      scroll?: boolean;
      state?: any;
    }

    async function handlePopState(evt: PopStateEvent) {
      const { path, state } = getLocation();
      if (await navigate(path)) {
        currentLocation = getLocation();
      }
    }

    async function navigate(to: string) {
      const response = await fetch(to, {
        headers: {
          "x-solid-referrer": currentLocation.path
        }
      });

      if (!response.ok) {
        console.error(`Navigation failed: ${response.status} ${response.statusText}`);
        return false;
      }

      const body = await response.text();
      const splitIndex = body.indexOf("=");
      const meta = body.substring(0, splitIndex);
      const content = body.substring(splitIndex + 1);

      if (meta) {
        const [prev, next] = meta.split(":");
        const outletEl = document.getElementById(prev);
        if (outletEl) {
          outletEl.innerHTML = content;
          outletEl.id = next;
          return true;
        } else {
          console.warn(`No outlet element with id ${prev}`);
        }
      } else {
        console.warn(`No meta data in response`);
      }

      return false;
    }

    document.addEventListener("click", handleAnchorClick);
    window.addEventListener("popstate", handlePopState);

    let componentMap = {};

    async function mountIsland(el) {
      let Component = componentMap[el.dataset.component];
      if (!Component) {
        Component = (await import(/* @vite-ignore */ el.dataset.component)).default;
        componentMap[el.dataset.component] = Component;
      }

      console.log(el.dataset.island);

      hydrate(() => createComponent(Component, JSON.parse(el.dataset.props)), el, {
        renderId: el.dataset.island + `2-`
      });
    }

    document.querySelectorAll("solid-island").forEach(el => {
      mountIsland(el);
    });

    return () => hydrate(code, element);
  }

  if (import.meta.env.START_SSR) {
    hydrate(code, element);
  } else {
    render(code, element.body);
  }
}
