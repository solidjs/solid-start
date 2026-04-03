import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";

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
  let element: T | null = null;
  let observer: IntersectionObserver | null = null;

  function setupObserver(el: T) {
    if (isServer) return;
    
    if (observer) {
      observer.disconnect();
    }
    
    observer = new IntersectionObserver(entries => {
      console.log("[lazy-render] intersection:", entries);
      for (const entry of entries) {
        if (entry.isIntersecting) {
          console.log("[lazy-render] element is intersecting, setting visible to true");
          setVisible(true);
          observer?.disconnect();
        }
      }
    });

    observer.observe(el);
    
    // Check immediately in case element is already visible
    requestAnimationFrame(() => {
      if (!el || !observer) return;
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      console.log("[lazy-render] rect:", rect, "isVisible:", isVisible);
      if (isVisible) {
        setVisible(true);
        observer.disconnect();
      }
    });

    // Also check after a short delay
    setTimeout(() => {
      if (!el || !observer) return;
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      console.log("[lazy-render] delayed check - isVisible:", isVisible);
      if (isVisible) {
        setVisible(true);
        observer.disconnect();
      }
    }, 100);
  }

  return {
    ref(value: T) {
      console.log("[lazy-render] ref called with:", value);
      element = value;
      if (element && !isServer) {
        setupObserver(element);
      }
    },
    get visible() {
      const v = visible();
      console.log("[lazy-render] visible getter:", v);
      return v;
    },
  };
}
