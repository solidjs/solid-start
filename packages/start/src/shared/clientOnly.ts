// @refresh skip
import type { Component, ComponentProps, JSX, Setter } from "solid-js";
import { createMemo, createSignal, onMount, sharedConfig, splitProps, untrack } from "solid-js";
import { isServer } from "solid-js/web";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/client/client-only
 */
// not using Suspense
export default function clientOnly<T extends Component<any>>(
  fn: () => Promise<{
    default: T;
  }>,
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

function load<T>(
  fn: () => Promise<{
    default: T;
  }>,
  setComp: Setter<T>
) {
  fn().then(m => setComp(() => m.default));
}
