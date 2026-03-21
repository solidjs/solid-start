"use server";

import { isServer } from "@solidjs/web";

export const serverFnWithIsServer = async () => {
  return isServer;
};
