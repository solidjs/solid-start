import { JSX } from "solid-js";
import { hydrate, MountableElement, render } from "solid-js/web";

export default function mount(code: () => JSX.Element, element: MountableElement) {
  if (import.meta.env.START_SSR) {
    hydrate(code, element);
  } else {
    render(code, element);
  }
}
