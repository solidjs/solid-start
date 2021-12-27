import { renderToStream } from "solid-js/web";
import { render as sRender } from "./server";

export function render({ url, writable }) {
  renderToStream(
    sRender({ url, manifest: {} }),
  ).pipe(writable);
}

export { renderActions } from "./server";
