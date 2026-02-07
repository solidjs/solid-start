import { isServer } from "solid-js/web";

export const serverFnWithIsServer = async () => {
  "use server";
  return isServer;
};
