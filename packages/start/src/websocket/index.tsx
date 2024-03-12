// @refresh skip
import { defineWebSocket, eventHandler } from "vinxi/http";

export function createWebSocket(args: Parameters<typeof defineWebSocket>) {
  return eventHandler({
    handler: () => {},
    websocket: defineWebSocket(args)
  });
}
