import { render } from "solid-js/web";
import "vinxi/runtime/client";

export function mount(fn, el) {
  render(fn, el);
}

export { StartClient } from "../StartClient";
