// This file contains global type definitions that are exported as @solidjs/start/env

/// <reference types="vite/client" />

declare namespace App {
  export interface RequestEventLocals {
    [key: string | symbol]: any;
  }
}

/**
 * Import `server-only` to ensure this module is never bundled for the client.
 * Importing it in a client module will throw a build error.
 */
declare module "server-only" {}

/**
 * Import `client-only` to ensure this module is never bundled for the server.
 * Importing it in a server module will throw a build error.
 */
declare module "client-only" {}
