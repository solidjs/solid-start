import { mount, StartClient } from "@solidjs/start/client";

// async function hello(name: string) {
//   "use server";
//   console.log("hello", name);
// }

// await hello("John");

mount(() => <StartClient />, document.getElementById("app"));
