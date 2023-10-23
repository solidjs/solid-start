import { mount, StartClient } from "@solidjs/start/client";

async function hello(name) {
  "use server";
  console.log("hello 1");
}

await hello("John");

mount(() => <StartClient />, document.getElementById("app"));
