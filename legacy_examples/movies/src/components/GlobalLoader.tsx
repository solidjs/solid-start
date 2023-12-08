"use client";
import { createSignal, Show } from "solid-js";
import { isServer } from "solid-js/web";

import "./GlobalLoader.scss";

export default () => {
  const [isVisible, setVisible] = createSignal();
  if (!isServer) {
    window.router.router.addEventListener("navigation-start", e => {
      setVisible(true);
    });

    window.router.router.addEventListener("navigation-end", e => {
      setVisible(false);
    });

    window.router.router.addEventListener("navigation-error", e => {
      setVisible(false);
    });
  }
  return (
    <Show when={isVisible()}>
      <div class="global-loader is-loading">
        <div class="global-loader-fill" />
      </div>
    </Show>
  );
};
