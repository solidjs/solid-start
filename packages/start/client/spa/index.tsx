import type { JSX } from "solid-js";
import { render } from "solid-js/web";
import "vinxi/client";

export function mount(fn: () => JSX.Element, el: HTMLElement) {
  render(fn, el);
}

export { StartClient } from "../StartClient";
