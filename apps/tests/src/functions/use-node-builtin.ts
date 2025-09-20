"use server";

import { join } from 'node:path';

export function serverFnWithNodeBuiltin() {

  return join('can','externalize');
}
