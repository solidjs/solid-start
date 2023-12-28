import { createSignal, onMount, Show } from 'solid-js';
import type { JSX } from 'solid-js';

export interface ClientOnlyProps {
  children?: JSX.Element;
}

export function ClientOnly(props: ClientOnlyProps): JSX.Element {
  const [show, setShow] = createSignal(false);

  onMount(() => {
    setShow(true);
  });

  return <Show when={show()}>{props.children}</Show>;
}
