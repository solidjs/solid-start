import Nprogress from "nprogress";

import { mount, StartClient } from "solid-start/entry-client";
mount(() => <StartClient />, document);

window.ROUTER.addEventListener("navigation-start", e => {
  Nprogress.start();
});

window.ROUTER.addEventListener("navigation-end", e => {
  Nprogress.done();
});

window.ROUTER.addEventListener("navigation-error", e => {
  Nprogress.done();
});
