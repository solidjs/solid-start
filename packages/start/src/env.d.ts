// This file is an augmentation to the built-in ImportMeta interface
// Thus cannot contain any top-level imports
// <https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation>

/* eslint-disable @typescript-eslint/consistent-type-imports */

declare namespace App {
  export interface RequestEventLocals {
    [key: string | symbol]: any;
  }
}

declare module "solidstart:server-fn-manifest" {
  const a: Record<string, { importer(): Promise<Record<string, any>>, functionName: string }>;

  export default a;
}

interface ImportMetaEnv extends Record<`VITE_${string}`, any>, SolidStartMetaEnv {
  BASE_URL: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
}

interface SolidStartMetaEnv {
  START_SSR: boolean;
  START_CLIENT_ENTRY: string;
  // START_ISLANDS: boolean;
  // START_DEV_OVERLAY: boolean;
  // SERVER_BASE_URL: string;
}
