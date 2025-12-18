// This file contains global type definitions that are exported as @solidjs/start/env

/// <reference types="vite/client" />

declare namespace App {
  export interface RequestEventLocals {
    [key: string | symbol]: any;
  }
}
