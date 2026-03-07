"use server";

import { isServer } from "@solidjs/web";

export function serverFnWithIsServer() {
  return isServer;
}
