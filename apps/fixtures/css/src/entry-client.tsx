// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";
import "./styles/entryClient.css";

mount(() => <StartClient />, document.getElementById("app")!);
