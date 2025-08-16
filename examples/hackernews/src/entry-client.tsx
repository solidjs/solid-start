// @refresh reload
import { StartClient } from "@solidjs/start-vite/client";
import { hydrate } from "solid-js/web";

hydrate(() => <StartClient />, document.getElementById("app")!);

// if (import.meta.env.PROD && "serviceWorker" in navigator) {
//   // Use the window load event to keep the page load performant
//   window.addEventListener("load", () => {
//     navigator.serviceWorker.register(`/sw.js`);
//   });
// }
