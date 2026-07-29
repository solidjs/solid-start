// This file contains global type definitions that are exported as @solidjs/start/env

/// <reference types="vite/client" />
// `server-only` / `client-only` boundary markers (provided by vite-plugin-solid).
/// <reference types="vite-plugin-solid/boundary-modules" />

declare namespace App {
  export interface RequestEventLocals {
    [key: string | symbol]: any;
  }
}
