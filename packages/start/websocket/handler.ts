import type { DurableObjectContext } from "../durable-object";
import { webSocketHandlers } from "./handlers";

export default async (request: Request, ctx: DurableObjectContext<{}>) => {
  // To accept the WebSocket request, we create a WebSocketPair (which is like a socketpair,
  // i.e. two WebSockets that talk to each other), we return one end of the pair in the
  // response, and we operate on the other end. Note that this API is not part of the
  // Fetch API standard; unfortunately, the Fetch API / Service Workers specs do not define
  // any way to act as a WebSocket server today.
  let pair = new WebSocketPair();
  const [client, server] = Object.values(pair);

  // We're going to take pair[1] as our end, and return pair[0] to the client.
  // Accept our end of the WebSocket. This tells the runtime that we'll be terminating the
  // WebSocket in JavaScript, not sending it elsewhere.
  // @ts-ignore
  server.accept();

  const websocketEvent = Object.freeze({ durableObject: ctx, request, env: {} });

  webSocketHandlers
    .find(h => h.url === new URL(request.url).pathname)
    ?.handler.call(websocketEvent, server, websocketEvent);

  // Now we return the other end of the pair to the client.
  return new Response(null, { status: 101, webSocket: client });
};
