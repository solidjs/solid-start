import type { Location, Params } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";

export interface LocationEntry {
  path: string;
  state: any;
  pathname: string;
  search: string;
  hash: string;
}

export function useSearchParams<T extends Params>() {
  const params = () => window.router.location().search;
  const [searchParams, setSearchParams] = createSignal(new URLSearchParams(params()));

  createEffect(() => {
    setSearchParams(new URLSearchParams(params()));
  });

  return {
    get "0"() {
      return searchParams();
    },
    get "1"() { return setSearchParams }
  } as unknown as [T, (params: T) => void];
}

export default function mountRouter() {
  if (import.meta.env.START_ISLANDS_ROUTER) {
    _$DEBUG("mounting islands router");

    const basePath = "/";
    let [currentLocation, setCurrentLocation] = createSignal<Location & LocationEntry>(
      getLocation()
    );

    let eventTarget = new EventTarget();

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

    function pushRoute(to: string | URL, options: Partial<NavigateOptions>) {
      let u = new URL(to, window.location.origin);
      if (options.replace) {
        history.replaceState(options.state, "", u);
      } else {
        history.pushState(options.state, "", u);
      }
      setCurrentLocation(getLocation());
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

      await doNavigate(to, options);
      pushRoute(to, options);
    }

    interface NavigateOptions {
      resolve?: boolean;
      replace?: boolean;
      scroll?: boolean;
      state?: any;
    }

    async function handlePopState(evt: PopStateEvent) {
      const { pathname, search, hash, state } = getLocation();
      const to = pathname + search + hash;
      if (await doNavigate(to)) {
        setCurrentLocation(getLocation());
      }
    }

    async function doNavigate(to: string, options: Partial<NavigateOptions> = {}) {
      router.router.dispatchEvent(new CustomEvent("navigation-start", { detail: to }));
      const response = await fetch(to, {
        method: "POST",
        headers: {
          "x-solid-referrer": currentLocation().pathname
        }
      });

      if (!response.ok) {
        console.error(`Navigation failed: ${response.status} ${response.statusText}`);
        router.router.dispatchEvent(new CustomEvent("navigation-error", { detail: to }));
        return false;
      }

      let body = await response.text();
      let updated = await update(body);
      if (updated) {
        router.router.dispatchEvent(new CustomEvent("navigation-end", { detail: to }));
        return true;
      }

      router.router.dispatchEvent(new CustomEvent("navigation-error", { detail: to }));
      return false;
    }

    async function navigate(to: string, options: Partial<NavigateOptions> = {}) {
      if (await doNavigate(to)) {
        pushRoute(to, options);
        return true;
      }
      return false;
    }

    let router = {
      navigate,
      push: pushRoute,
      update,
      router: eventTarget,
      location: currentLocation
    };

    window.router = router;

    document.addEventListener("click", handleAnchorClick);
    window.addEventListener("popstate", handlePopState);
    _$DEBUG("mounted islands router");
  }
}

async function update(body: string) {
  let assets: [[string, string][], [string, string][]] | undefined;
  if (body.charAt(0) === "a") {
    const assetsIndex = body.indexOf(";");
    assets = JSON.parse(body.substring("assets=".length, assetsIndex));
    body = body.substring(assetsIndex + 1);
  }

  if (body.charAt(0) === "o") {
    const splitIndex = body.indexOf("=");
    const meta = body.substring(0, splitIndex);
    const content = body.substring(splitIndex + 1);

    if (meta) {
      if (assets && assets.length) {
        assets[0].forEach(([assetType, href]) => {
          if (!document.querySelector(`link[href="${href}"]`)) {
            let link = document.createElement("link");
            link.rel = assetType === "style" ? "stylesheet" : "modulepreload";
            link.href = href;
            document.head.appendChild(link);
          }
        });

        assets[1].forEach(([assetType, href]) => {
          let el = document.querySelector(`link[href="${href}"]`);
          if (el) {
            document.head.removeChild(el);
          }
        });
      }

      const [prev, next] = meta.split(":");
      const outletEl = document.getElementById(prev);
      if (outletEl) {
        let doc = document.implementation.createHTMLDocument();
        doc.write(`<outlet-wrapper id="${next}">`);
        doc.write(content);
        doc.write("</outlet-wrapper>");

        if (import.meta.env.START_ISLANDS) {
          await window._$HY.morph(outletEl, doc.body.firstChild as HTMLElement);
        }
        return true;
      } else {
        console.warn(`No outlet element with id ${prev}`);
      }
    } else {
      console.warn(`No meta data in response`);
    }
  }
  return false;
}
