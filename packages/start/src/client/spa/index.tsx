// @refresh skip
import type { JSX } from "solid-js";
import { render, type MountableElement } from "solid-js/web";
import { seedInitialData } from "./initial-data.ts";

export function mount(fn: () => JSX.Element, el: MountableElement) {
  const restore = import.meta.env.START_SSR_DATA ? seedInitialData() : undefined;
  try {
    render(fn, el);
  } finally {
    restore?.();
  }
}

export { StartClient } from "../StartClient.tsx";
