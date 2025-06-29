// @refresh reload
import { StartClient } from "@solidjs/start-vite/client";
import { hydrate } from "solid-js/web";

hydrate(() => <StartClient />, document.getElementById("app")!);
