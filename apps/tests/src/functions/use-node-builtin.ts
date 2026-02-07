import { join } from "node:path";

export function serverFnWithNodeBuiltin() {
  "use server";
  return join("can", "externalize");
}
