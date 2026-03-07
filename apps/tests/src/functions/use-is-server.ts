"use server";

import { isServer } from "solid-js/web";
import { keepAlive } from "~/utils/keep-alive-util";

const serverSecret = "MyServerSuperSecretUniqueString2";


export function serverFnWithIsServer() {
  keepAlive(serverSecret);
  return isServer;
}
