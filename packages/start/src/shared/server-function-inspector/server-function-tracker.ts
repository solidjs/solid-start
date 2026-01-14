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

export function captureServerFunctionCall(
  listener: ServerFunctionCallListener,
): () => void {
  LISTENERS.add(listener);
  return () => LISTENERS.delete(listener);
}

export function pushRequest(
  id: string,
  instance: string,
  source: Request,
): void {
  const event: ServerFunctionCall = {
    type: "request",
    id,
    instance,
    source,
    time: performance.now(),
  };
  for (const listener of new Set(LISTENERS)) {
    listener(event);
  }
}

export function pushResponse(
  id: string,
  instance: string,
  source: Response,
): void {
  const event: ServerFunctionCall = {
    type: "response",
    id,
    instance,
    source,
    time: performance.now(),
  };
  for (const listener of new Set(LISTENERS)) {
    listener(event);
  }
}
