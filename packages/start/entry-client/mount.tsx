import type { JSX } from "solid-js";
import { hydrate, render } from "solid-js/web";

import { hydrateServerRouter } from "../islands/mount";
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

export default function mount(code: () => JSX.Element, element: Document) {
  if (import.meta.env.START_ISLANDS) {
    mountRouter();
    hydrateServerRouter();
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
