/// <reference types="@cloudflare/workers-types" />

declare global {
  interface Env {
    app: KVNamespace;
    DO_WEBSOCKET: DurableObjectNamespace;
  }
}

export {};
