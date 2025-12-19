// This file contains global type definitions that are internal to SolidStart and are not exported

declare module "solidstart:server-fn-manifest" {
  type ServerFn = (...args: Array<any>) => Promise<any>;
  export function getServerFnById(id: string): Promise<ServerFn>;
}

interface ImportMetaEnv extends SolidStartMetaEnv {}

interface SolidStartMetaEnv {
  START_SSR: boolean;
  START_APP_ENTRY: string;
  START_CLIENT_ENTRY: string;
  START_ISLANDS: boolean;
  // START_DEV_OVERLAY: boolean;
  // SERVER_BASE_URL: string;
}
