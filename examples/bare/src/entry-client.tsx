import { mount, StartClient } from "@solidjs/start/client";

async function hello(name) {
  "use server";
  console.log("hello");
}

await hello("John");

mount(() => <StartClient />, document.getElementById("app"));
