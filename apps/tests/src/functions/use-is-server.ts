

import { isServer } from "solid-js/web";

export function serverFnWithIsServer() {
  "use server";
  return isServer;
}
