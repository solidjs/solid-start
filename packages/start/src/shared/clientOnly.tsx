// @refresh skip
import type { Component, ComponentProps, JSX, Setter } from "solid-js";
import { createMemo, createSignal, onMount, sharedConfig, splitProps, untrack } from "solid-js";
import { isServer } from "solid-js/web";

/**
 * What a `clientOnly` loader can resolve to: a module with a default export,
 * or the component itself.
 */
type ClientOnlyModule<T> = T | { default: T };

/**
 * Renders a component only on the client. The loader can resolve to a module
 * with a default export, or to the component itself, which also works for a
 * named export:
 *
 * ```tsx
 * const Map = clientOnly(() => import("./map"));
 * const Chart = clientOnly(() => import("./chart").then(({ Chart }) => Chart));
 * ```
 *
 * Destructuring the export inside the loader, as in the second example, lets
 * the bundler leave the module's other exports out of the chunk.
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/client/client-only
 */
// not using Suspense
export default function clientOnly<T extends Component<any>>(
  fn: () => Promise<ClientOnlyModule<T>>,
  options: { lazy?: boolean } = {}
) {
  if (isServer) return (props: ComponentProps<T> & { fallback?: JSX.Element }) => props.fallback;

  const [comp, setComp] = createSignal<T>();
  !options.lazy && load(fn, setComp);
  return (props: ComponentProps<T>) => {
    let Comp: T | undefined;
    let m: boolean;
    const [, rest] = splitProps(props, ["fallback"]);
    options.lazy && load(fn, setComp);
    if ((Comp = comp()) && !sharedConfig.context) return Comp(rest);
    const [mounted, setMounted] = createSignal(!sharedConfig.context);
    onMount(() => setMounted(true));
    return createMemo(
      () => (
        (Comp = comp()), (m = mounted()), untrack(() => (Comp && m ? Comp(rest) : props.fallback))
      )
    );
  };
}

function load<T extends Component<any>>(
  fn: () => Promise<ClientOnlyModule<T>>,
  setComp: Setter<T | undefined>
) {
  // A module namespace object is never a function, and a component always is.
  fn().then(m => setComp(() => (typeof m === "function" ? m : m.default)));
}
