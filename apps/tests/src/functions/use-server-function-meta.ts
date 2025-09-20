"use server";

import { getServerFunctionMeta } from "@solidjs/start";

export function serverFnWithMeta() {
  return typeof getServerFunctionMeta()?.id;
}
