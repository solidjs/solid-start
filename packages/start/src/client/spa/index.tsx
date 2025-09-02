// @refresh skip
import type { JSX } from "solid-js";
import { render, type MountableElement } from "solid-js/web";

export function mount(fn: () => JSX.Element, el: MountableElement) {
  render(fn, el);
}

export { StartClient } from "../StartClient.jsx";
