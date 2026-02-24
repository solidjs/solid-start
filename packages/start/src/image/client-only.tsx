import type { JSX } from "solid-js";
import { createSignal, onMount, Show } from "solid-js";
import { isServer } from "solid-js/web";

export const createClientSignal = isServer
  ? (): (() => boolean) => () => false
  : (): (() => boolean) => {
      const [flag, setFlag] = createSignal(false);

      onMount(() => {
        setFlag(true);
      });

      return flag;
    };

export interface ClientOnlyProps {
  fallback?: JSX.Element;
  children?: JSX.Element;
}

export const ClientOnly = (props: ClientOnlyProps): JSX.Element => {
  const isClient = createClientSignal();

  return Show({
    keyed: false,
    get when() {
      return isClient();
    },
    get fallback() {
      return props.fallback;
    },
    get children() {
      return props.children;
    },
  });
};
