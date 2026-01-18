import { getServerFunctionMeta } from "@solidjs/start";

export function serverFnWithMeta() {
  "use server";

  return typeof getServerFunctionMeta()?.id;
}
