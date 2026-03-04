// @refresh skip
import type { JSX } from "solid-js";
import { render, type MountableElement } from "@solidjs/web";

export function mount(fn: () => JSX.Element, el: MountableElement) {
  render(fn, el);
}

export { StartClient } from "../StartClient.tsx";
