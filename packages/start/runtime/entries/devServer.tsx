import { renderToStream } from "solid-js/web";
import { render as sRender } from "./server";

export function render({ url, writable, context }) {
  renderToStream(
    sRender({ url, manifest: {}, context }),
  ).pipe(writable);
}

export { renderActions } from "./server";
