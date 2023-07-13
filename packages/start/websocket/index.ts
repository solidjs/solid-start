import { ServerFunction } from "../server/server-functions/types";
import { webSocketHandlers } from "./handlers";

function createWebsocket(fn: ServerFunction<[WebSocket, WebSocketEvent], (a: WebSocket, b: WebSocketEvent) => void>) {
  return (id: string = "") =>
    new WebSocket(`${location.origin.replace(/^http/, "ws")}${fn.url}?id=${id}`);
}

interface WebSocketEvent {
  durableObject: any;
  request: Request;
}

export function createWebSocketServer(
  fn: ServerFunction<[WebSocket, WebSocketEvent], (a: WebSocket, b: WebSocketEvent) => void>
) {
  if (import.meta.env.SSR) {
    webSocketHandlers.push({
      url: fn.url,
      handler: fn
    });
    return {
      connect() {
        throw new Error("Cannot connect to websocket server on the server itself");
      }
    };
  } else {
    const websocket = createWebsocket(fn);
    return {
      connect: websocket
    };
  }
}
