export type ServerFunctionRequest = {
  type: "request";
  id: string;
  instance: string;
  source: Request;
  time: number;
};
export type ServerFunctionResponse = {
  type: "response";
  id: string;
  instance: string;
  source: Response;
  time: number;
};

export type ServerFunctionCall = ServerFunctionRequest | ServerFunctionResponse;

export type ServerFunctionCallListener = (event: ServerFunctionCall) => void;

const LISTENERS = new Set<ServerFunctionCallListener>();

export function captureServerFunctionCall(listener: ServerFunctionCallListener): () => void {
  LISTENERS.add(listener);
  return () => LISTENERS.delete(listener);
}

// Listeners run synchronously inside the transport's call path; a throwing
// listener must never break the server-function call it is observing.
function notify(event: ServerFunctionCall): void {
  for (const listener of new Set(LISTENERS)) {
    try {
      listener(event);
    } catch (error) {
      console.error("[solid-start] dev toolbar tracker listener failed:", error);
    }
  }
}

export function pushRequest(id: string, instance: string, source: Request): void {
  notify({
    type: "request",
    id,
    instance,
    source,
    time: performance.now(),
  });
}

export function pushResponse(id: string, instance: string, source: Response): void {
  notify({
    type: "response",
    id,
    instance,
    source,
    time: performance.now(),
  });
}
