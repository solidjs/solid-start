import Nprogress from "nprogress";

import { mount, StartClient } from "solid-start/entry-client";

mount(() => <StartClient />, document);

window.router.router.addEventListener("navigation-start", e => {
  Nprogress.start();
});

window.router.router.addEventListener("navigation-end", e => {
  Nprogress.done();
});

window.router.router.addEventListener("navigation-error", e => {
  Nprogress.done();
});
