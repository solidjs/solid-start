import { useRouteData } from "@solidjs/router";
import { createEffect, onCleanup } from "solid-js";
import server, { createServerAction, createServerData, redirect } from "solid-start/server";
import { WebSocketDurableObject } from "~/do";
import { getUser, logout } from "~/session";
import { webSocketHandlers } from "solid-start/websocket/webSocketHandlers";
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

interface User {
  websocket: WebSocket;
  id: string;
  city: string | undefined;
  country: string;
}

type Message = Message.Ping | Message.Pong;

const pingPong = createWebSocketServer(
  server(function (this: WebSocketDurableObject<{ users: Map<string, User> }>, webSocket) {
    if (!this.users) {
      this.users = new Map();
      this.pings = new Map();
    }
    // Create our session and add it to the users map.
    const userId = crypto.randomUUID();
    this.users.set(userId, {
      id: userId,
      websocket: webSocket
    });

    console.log(userId, this.users.get(userId));

    webSocket.addEventListener("message", async msg => {
      try {
        // Parse the incoming message
        let incomingMessage = JSON.parse(msg.data);
        console.log(incomingMessage);

        switch (incomingMessage.type) {
          case "ping":
            const msg = {
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
  })
);

function createWebSocketServer(fn) {
  if (import.meta.env.SSR) {
    webSocketHandlers.push({
      url: fn.url,
      handler: fn
    });
    return {};
  } else {
    const websocket = createWebsocket(fn);
    return {
      connect: websocket
    };
  }
}

export function routeData() {
  return createServerData(async (_, { request, env }) => {
    const user = await getUser(request);

    if (!user) {
      throw redirect("/login");
    }

    return user;
  });
}

function createWebsocket(fn) {
  return () => new WebSocket(`${location.origin.replace(/^http/, "ws")}${fn.url}`);
}

export default function Home() {
  const user = useRouteData<typeof routeData>();
  const envData = createServerData(
    () => "k",
    async (_, { request, env }) => {
      return await env.app.get("key");
    }
  );
  const logoutAction = createServerAction((_, { request }) => logout(request));

  const increment = createServerAction(
    async (_, { env }) => {
      await env.app.put("key", `${Number(await this.env.app.get("key")) + 1}`);
      return redirect("/");
    },
    {
      invalidate: () => "k"
    }
  );

  createEffect(() => {
    let websocket = pingPong.connect();

    websocket.addEventListener("message", event => {
      const messages = JSON.parse(event.data);
      console.log(messages);
    });

    function sendWebSocketMessage(type, data) {
      websocket.send(JSON.stringify({ type, data }));
    }

    websocket.addEventListener("close", event => {
      console.log(event);
    });

    // client ping <-> server pong
    let interval = setInterval(() => {
      try {
        const id = crypto.randomUUID();
        sendWebSocketMessage("ping", { id, lastPingMs: 0 });
      } catch (e) {}
    }, 1000);

    onCleanup(() => {
      clearInterval(interval);
      websocket.close();
    });
  });

  return (
    <main class="w-full p-4 space-y-2">
      <h1 class="font-bold text-3xl">Hello {user()?.username}</h1>
      <h3 class="font-bold text-xl">Message board</h3>
      {envData()}
      <increment.Form>
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Increment
        </button>
      </increment.Form>
      <logoutAction.Form>
        <button name="logout" type="submit">
          Logout
        </button>
      </logoutAction.Form>
    </main>
  );
}
