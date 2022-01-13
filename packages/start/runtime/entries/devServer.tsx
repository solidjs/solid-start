import { renderToStream, renderToStringAsync } from "solid-js/web";
import { render as sRender } from "./server";

export async function render({ url, writable, context }) {
  let string = await renderToStringAsync(sRender({ url, manifest: {}, context }));
  writable.write(string);
  writable.end();
}

export { renderActions } from "./server";
