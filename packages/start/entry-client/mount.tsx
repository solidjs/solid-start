import type { JSX } from "solid-js";
import { hydrate, render } from "solid-js/web";

import { mountIslands } from "../islands/mount";
import mountRouter from "../islands/router";

declare global {
  interface Window {
    INSPECT: () => void;
  }
}

if (import.meta.env.DEV) {
  window.DEBUG = localStorage.getItem("debug")?.includes("start")
    ? console.log
    : ((() => {}) as unknown as any);

  DEBUG(`import.meta.env.DEV = ${import.meta.env.DEV}`);
  DEBUG(`import.meta.env.PROD = ${import.meta.env.PROD}`);
  DEBUG(`import.meta.env.START_SSR = ${import.meta.env.START_SSR}`);
  DEBUG(`import.meta.env.START_ISLANDS = ${import.meta.env.START_ISLANDS}`);
  DEBUG(`import.meta.env.START_ISLANDS_ROUTER = ${import.meta.env.START_ISLANDS_ROUTER}`);
  DEBUG(`import.meta.env.SSR = ${import.meta.env.SSR}`);

  window.INSPECT = () => {
    window.open(window.location.href.replace(window.location.pathname, "/__inspect"));
  };
}

export default function mount(code?: () => JSX.Element, element?: Document) {
  if (import.meta.env.START_ISLANDS) {
    mountRouter();
    mountIslands();
    return;
  } else if (import.meta.env.START_ISLANDS_ROUTER) {
    mountRouter();
    return;
  }

  if (import.meta.env.START_SSR) {
    hydrate(code, element);
  } else {
    render(code, element === document ? element.body : element);
  }
}
