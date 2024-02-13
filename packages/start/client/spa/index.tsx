import type { JSX } from "solid-js";
import type { MountableElement } from "solid-js/web";
import { render } from "solid-js/web";
import "vinxi/client";

export function mount(code: () => JSX.Element, element: MountableElement) {
  render(code, element);
}

export { StartClient } from "../StartClient";
