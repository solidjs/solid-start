import { JSX } from "solid-js";
import { hydrate, render } from "solid-js/web";

export default function mount(code: () => JSX.Element, element: Document) {
  if (import.meta.env.START_SSR) {
    hydrate(code, element);
  } else {
    render(code, element.body);
  }
}
