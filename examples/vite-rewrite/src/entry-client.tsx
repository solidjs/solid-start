// @refresh reload
import { hydrate } from "solid-js/web";
import { StartClient } from "@solidjs/start-vite/client";

hydrate(() => <StartClient />, document.getElementById("app")!);
