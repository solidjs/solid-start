declare global {
  interface Env {
    app: KVNamespace;
    DO_WEBSOCKET: DurableObjectNamespace;
  }
}

export {};
