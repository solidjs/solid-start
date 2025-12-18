import type { JSX } from "solid-js";
import { hydrate, type MountableElement } from "solid-js/web";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/client/mount
 */
export function mount(fn: () => JSX.Element, el: MountableElement) {
  return hydrate(fn, el);
}
