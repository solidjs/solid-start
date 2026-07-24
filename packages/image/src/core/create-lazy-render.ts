import { createEffect, createSignal, onCleanup } from "solid-js";

export interface LazyRender<T extends HTMLElement> {
  ref: (value: T) => void;
  visible: boolean;
}

export interface LazyRenderOptions {
  refresh?: boolean;
}

export function createLazyRender<T extends HTMLElement>(
  options?: LazyRenderOptions,
): LazyRender<T> {
  const [visible, setVisible] = createSignal(false);

  // We use a reactive ref here so that the component
  // re-renders if the host element changes, therefore
  // re-evaluating our intersection logic
  const [ref, setRef] = createSignal<T | null>(null);

  createEffect(() => {
    // If the host changed, make sure that
    // visibility is set to false
    setVisible(false);
    const shouldRefresh = options?.refresh;

    const current = ref();
    if (!current) {
      return;
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (shouldRefresh) {
          setVisible(entry.isIntersecting);
        } else if (entry.isIntersecting) {
          // Host intersected, set visibility to true
          setVisible(true);

          // Stop observing
          observer.disconnect();
        }
      }
    });

    observer.observe(current);

    onCleanup(() => {
      observer.unobserve(current);
      observer.disconnect();
    });
  });

  return {
    ref(value) {
      return setRef(() => value);
    },
    get visible() {
      return visible();
    },
  };
}
