import { hydrate } from "solid-js/web";
import "vinxi/runtime/client";

export function mount(fn, el) {
	return hydrate(fn, el);
}
