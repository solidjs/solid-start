import { mount, StartClient } from "@solidjs/start/client";

async function hello() {
  "use server";
  console.log("hello");
}

await hello();

mount(() => <StartClient />, document.getElementById("app"));
