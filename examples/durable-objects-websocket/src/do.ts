import "./routes/index";
import { webSocketHandlers } from "solid-start/websocket/webSocketHandlers";

export type WebSocketServerDurableObject<T> = T & {
  fetch: (request: Request) => Promise<Response>;
};

export class WebSocketDurableObject<T> {
  storage: DurableObjectStorage;
  dolocation: string;

  constructor(state: DurableObjectState) {
    // We will put the WebSocket objects for each client into `websockets`
    this.storage = state.storage;
    this.dolocation = "";

    // this.scheduleNextAlarm(this.storage);
    this.getDurableObjectLocation();
  }

  async fetch(request: Request) {
    const requestMetadata = request.cf;

    // To accept the WebSocket request, we create a WebSocketPair (which is like a socketpair,
    // i.e. two WebSockets that talk to each other), we return one end of the pair in the
    // response, and we operate on the other end. Note that this API is not part of the
    // Fetch API standard; unfortunately, the Fetch API / Service Workers specs do not define
    // any way to act as a WebSocket server today.
    let pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // We're going to take pair[1] as our end, and return pair[0] to the client.
    await this.handleWebSocketSession(request, server, requestMetadata);

    // Now we return the other end of the pair to the client.
    return new Response(null, { status: 101, webSocket: client });
  }

  async handleWebSocketSession(
    request: Request,
    webSocket: WebSocket,
    metadata: IncomingRequestCfProperties
  ) {
    // Accept our end of the WebSocket. This tells the runtime that we'll be terminating the
    // WebSocket in JavaScript, not sending it elsewhere.
    // @ts-ignore
    webSocket.accept();

    webSocketHandlers
      .find(h => h.url === new URL(request.url).pathname)
      ?.handler.call(this, webSocket, metadata);
  }

  // broadcast() broadcasts a message to all clients.
  // broadcast(message: string) {
  //   // Iterate over all the sessions sending them messages.
  //   this.users.forEach((user, key) => {
  //     try {
  //       user.websocket.send(message);
  //     } catch (err) {
  //       this.users.delete(key);
  //     }
  //   });
  // }

  async getDurableObjectLocation() {
    const res = await fetch("https://workers.cloudflare.com/cf.json");
    const json = (await res.json()) as IncomingRequestCfProperties;
    this.dolocation = `${json.city} (${json.country})`;
  }

  // scheduleNextAlarm(storage: DurableObjectStorage) {
  //   try {
  //     const alarmTime = Date.now() + healthCheckInterval;
  //     storage.setAlarm(alarmTime);
  //   } catch {
  //     console.log("Durable Objects Alarms not supported in Miniflare (--local mode) yet.");
  //   }
  // }

  // alarm() {
  //   const msg = { type: "healthcheck" };
  //   this.broadcast(JSON.stringify([msg]));

  //   if (this.users.size) this.scheduleNextAlarm(this.storage);
  // }
}
