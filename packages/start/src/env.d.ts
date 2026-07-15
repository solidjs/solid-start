// This file contains global type definitions that are internal to SolidStart and are not exported

declare module "solid-start:server-fn-manifest" {
  type ServerFn = (...args: Array<any>) => Promise<any>;
  export function getServerFnById(id: string): Promise<ServerFn>;
}

interface ImportMetaEnv extends SolidStartMetaEnv {}

interface SolidStartMetaEnv {
  START_SSR: boolean;
  /** Root-relative (posix) path to the app entry, e.g. `src/app.tsx`. */
  START_APP_ENTRY: string;
  START_CLIENT_ENTRY: string;
  START_ISLANDS: boolean;
  /** Inline dev script from vite-plugin-solid reconciling SSR'd dev styles with Vite's HMR client. */
  START_DEV_STYLE_PATCH: string;
  // START_DEV_OVERLAY: boolean;
  // SERVER_BASE_URL: string;
}
