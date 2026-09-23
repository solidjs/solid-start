import { hydrate } from "solid-js/web";

export const mount: typeof hydrate = (code, element, options) => {
  const initialUrl = document
    .querySelector("script[data-start-url]")
    ?.getAttribute("data-start-url");
  const hydration = (
    globalThis as typeof globalThis & {
      _$HY?: { done?: boolean; events: unknown[] | null };
    }
  )._$HY;

  if (hydration && initialUrl && initialUrl !== location.pathname + location.search) {
    // The browser moved on before hydration started. Use hydrate's client-render
    // fallback and prevent late SSR fragments or queued events from being applied.
    hydration.done = true;
    hydration.events = null;
  }

  return hydrate(code, element, options);
};
