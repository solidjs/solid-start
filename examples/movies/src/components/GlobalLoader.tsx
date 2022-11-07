"use client";
import { createSignal, createEffect } from "solid-js";
import { isServer } from "solid-js/web";

import "./GlobalLoader.scss";

export default (props) => {
  const [isVisible, setVisible] = createSignal();
  if (!isServer) {
    window.router.router.addEventListener("navigation-start", e => {
      setVisible(true);
    });

    window.router.router.addEventListener("navigation-end", e => {
      setTimeout(() => {
        setVisible(false);
      }, 300)
    });

    window.router.router.addEventListener("navigation-error", e => {
      setTimeout(() => {
        setVisible(false);
      }, 300)
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