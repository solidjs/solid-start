"use server";

import { getServerFunctionMeta } from "@solidjs/start";

import { SERVER_EXAMPLE } from 'env:server';

export function serverFnWithMeta() {
  console.log(SERVER_EXAMPLE);
  return typeof getServerFunctionMeta()?.id;
}
