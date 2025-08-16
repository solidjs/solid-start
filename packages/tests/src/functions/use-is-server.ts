"use server";

import { isServer } from "solid-js/web";

const secret = "SERVER ONLY SECRET";

console.log("Server secrets!", secret);

export function serverFnWithIsServer() {
  console.log("Server secrets!", secret);
  return isServer;
}
