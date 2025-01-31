"use server";

import { isServer } from "solid-js/web";

export function serverFnWithIsServer() {
  return isServer;
}
