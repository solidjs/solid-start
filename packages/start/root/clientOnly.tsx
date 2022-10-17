import type { Component, JSX } from "solid-js";
import { createSignal, lazy, onMount, sharedConfig, Show, splitProps } from "solid-js";
import { isServer } from "solid-js/web";

export default function clientOnly<T extends Component<any>>(
  fn: () => Promise<{
    default: T;
  }>
) {
  const Comp = isServer ? () => {} : lazy(fn);
  return (props: T & { fallback?: () => JSX.Element }) => {
    const [, rest] = splitProps(props, ["fallback"]);
    const [hydrated, setHydrated] = createSignal(!sharedConfig.context);
    onMount(() => setHydrated(true));
    return (
      <Show when={hydrated()} fallback={props.fallback}>
        <Comp {...rest} />
      </Show>
    );
  };
}
