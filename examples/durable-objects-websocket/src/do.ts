interface User {
  websocket: WebSocket;
  id: string;
  city: string | undefined;
  country: string;
}

type Message = Message.Ping | Message.Pong;

namespace Message {
  export type Ping = {
    type: "ping";
    data: {
      id: string;
      lastPingMs: number;
    };
  };

  export type Pong = {
    type: "pong";
    data: {
      id: string;
      time: number;
      dolocation: string;
      users: Array<User & { ping: number; websocket: undefined }>;
    };
  };
}

// every 10 seconds
const healthCheckInterval = 10e3;

export class WebSocketDurableObject {
  users: Map<string, User>;
  pings: Map<string, number>;
  storage: DurableObjectStorage;
  dolocation: string;

  constructor(state: DurableObjectState) {
    // We will put the WebSocket objects for each client into `websockets`
    this.users = new Map();
    this.pings = new Map();
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
    await this.handleWebSocketSession(server, requestMetadata);

    // Now we return the other end of the pair to the client.
    return new Response(null, { status: 101, webSocket: client });
  }

  async handleWebSocketSession(webSocket: WebSocket, metadata: IncomingRequestCfProperties) {
    // Accept our end of the WebSocket. This tells the runtime that we'll be terminating the
    // WebSocket in JavaScript, not sending it elsewhere.
    webSocket.accept();

    // Create our session and add it to the users map.
    const userId = crypto.randomUUID();
    this.users.set(userId, {
      id: userId,
      city: metadata.city,
      country: metadata.country,
      websocket: webSocket
    });

    console.log(userId, this.users.get(userId));

    webSocket.addEventListener("message", async msg => {
      try {
        // Parse the incoming message
        let incomingMessage = JSON.parse(msg.data) as Message.Ping;
        console.log(incomingMessage);

        switch (incomingMessage.type) {
          case "ping":
            const msg: Message.Pong = {
              type: "pong",
              data: {
                id: incomingMessage.data.id,
                time: Date.now(),
                dolocation: this.dolocation,
                users: Array.from(this.users.values()).map(x => {
                  // update user's ping
                  if (incomingMessage.data.lastPingMs && x.websocket === webSocket) {
                    this.pings.set(x.id, incomingMessage.data.lastPingMs);
                  }

                  return {
                    ...x,
                    ping: this.pings.get(x.id),
                    websocket: undefined
                  };
                })
              }
            };
            webSocket.send(JSON.stringify([msg]));
            break;
        }
      } catch (err) {
        // Report any exceptions directly back to the client. As with our handleErrors() this
        // probably isn't what you'd want to do in production, but it's convenient when testing.
        webSocket.send(JSON.stringify({ error: err.stack }));
      }
    });

    // On "close" and "error" events, remove the WebSocket from the webSockets list
    let closeOrErrorHandler = ev => {
      console.log("user", userId, ev);
      this.users.delete(userId);
      console.log(this.users.size);
    };
    webSocket.addEventListener("close", closeOrErrorHandler);
    webSocket.addEventListener("error", closeOrErrorHandler);
  }

  // broadcast() broadcasts a message to all clients.
  broadcast(message: string) {
    // Iterate over all the sessions sending them messages.
    this.users.forEach((user, key) => {
      try {
        user.websocket.send(message);
      } catch (err) {
        this.users.delete(key);
      }
    });
  }

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
