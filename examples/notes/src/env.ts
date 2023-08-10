/// <reference types="@cloudflare/workers-types" />

declare global {
  interface Env {
    KV: KVNamespace;
    db: DurableObjectNamespace;
  }
}

export {};
