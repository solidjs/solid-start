import type { Location, Navigator } from "@solidjs/router";
import { createSignal } from "solid-js";
interface LocationEntry {
  path: string;
  state: any;
  pathname: string;
  search: string;
  hash: string;
}

export default function mountRouter() {
  if (import.meta.env.START_ISLANDS_ROUTER) {
    _$DEBUG("mounting islands router");

    const basePath = "/";
    let [currentLocation, setCurrentLocation] = createSignal<Location>(getLocation());
    window.LOCATION = currentLocation;

    function getLocation(): Location & LocationEntry {
      const { pathname, search, hash } = window.location;
      return {
        path: pathname + search + hash,
        state: history.state,
        pathname,
        search,
        hash,
        query: {},
        key: ""
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
        | undefined;

      if (!a || !a.hasAttribute("link")) return;

      const href = a.href;
      const target = a.target;
      if (target || (!href && !a.hasAttribute("state"))) return;

      const rel = (a.getAttribute("rel") || "").split(/\s+/);
      if (a.hasAttribute("download") || (rel && rel.includes("external"))) return;

      const url = new URL(href);
      if (
        url.origin !== window.location.origin ||
        (basePath && url.pathname && !url.pathname.toLowerCase().startsWith(basePath.toLowerCase()))
      )
        return;

      const prevLocation = getLocation();

      const to = url.pathname + url.search + url.hash;
      const state = a.getAttribute("state");

      if (url.pathname === prevLocation.pathname && url.search === prevLocation.search) {
        if (url.hash !== prevLocation.hash) {
          window.location.hash = url.hash;
          setCurrentLocation(getLocation());
        }
      }

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
        setCurrentLocation(getLocation());
      }
    }

    interface NavigateOptions {
      resolve?: boolean;
      replace?: boolean;
      scroll?: boolean;
      state?: any;
    }

    async function handlePopState(evt: PopStateEvent) {
      const { pathname, state } = getLocation();
      if (currentLocation().pathname !== pathname) {
        if (await navigate(pathname)) {
          setCurrentLocation(getLocation());
        }
      }
    }

    async function navigate(to: string, options: NavigateOptions = {}) {
      const response = await fetch(to, {
        method: "POST",
        headers: {
          "x-solid-referrer": currentLocation().pathname
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
          window._$HY && window._$HY.hydrateIslands && window._$HY.hydrateIslands();
          return true;
        } else {
          console.warn(`No outlet element with id ${prev}`);
        }
      } else {
        console.warn(`No meta data in response`);
      }

      return false;
    }

    window.NAVIGATE = navigate as unknown as Navigator;

    document.addEventListener("click", handleAnchorClick);
    window.addEventListener("popstate", handlePopState);
    _$DEBUG("mounted islands router");
  }
}
