// @refresh reload
import { hydrate } from "solid-js/web";
import { StartClient } from "@solidjs/start/client";

hydrate(() => <StartClient />, document.getElementById("app")!);
