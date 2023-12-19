import { render } from "solid-js/web";
import "vinxi/client";

export function mount(fn, el) {
  render(fn, el);
}

export { StartClient } from "../StartClient";
