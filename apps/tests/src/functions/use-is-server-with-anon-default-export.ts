import { isServer } from "@solidjs/web";

export function serverFnWithIsServer() {
  "use server";
  return isServer;
}

export default function () {
  return null;
}
