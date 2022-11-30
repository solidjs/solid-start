import { createEffect, createSignal, For, onCleanup } from "solid-js";
import { useParams, useRouteData } from "solid-start";
import server$, { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { createWebSocketServer } from "solid-start/websocket";
import { getUser, logout } from "~/session";

interface User {
  websocket: WebSocket;
  id: string;
  // city: string | undefined;
  // country: string;
}

const room = createWebSocketServer(server$(presence));

function presence(webSocket: WebSocket, { durableObject }: { durableObject: { users: Map<string, User>; pings: Map<string, number> } }) {
  let object = durableObject;
  if (!object.users) {
    object.users = new Map();
    object.pings = new Map();
  }

  // Create our session and add it to the users map.
  const userId = crypto.randomUUID();
  object.users.set(userId, {
    id: userId,
    websocket: webSocket
  });

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
              users: Array.from(object.users.values()).map(x => {
                // update user's ping
                if (incomingMessage.data.lastPingMs && x.websocket === webSocket) {
                  object.pings.set(x.id, incomingMessage.data.lastPingMs);
                }

                return {
                  ...x,
                  ping: object.pings.get(x.id),
                  websocket: undefined
                };
              })
            }
          };
          webSocket.send(JSON.stringify([msg]));
          break;
      }
    } catch (err: any) {
      // Report any exceptions directly back to the client. As with our handleErrors() this
      // probably isn't what you'd want to do in production, but it's convenient when testing.
      webSocket.send(JSON.stringify({ error: err.stack }));
    }
  });

  // On "close" and "error" events, remove the WebSocket from the webSockets list
  let closeOrErrorHandler = (ev: any) => {
    console.log("user", userId, ev);
    object.users.delete(userId);
    console.log(object.users.size);
  };
  webSocket.addEventListener("close", closeOrErrorHandler);
  webSocket.addEventListener("error", closeOrErrorHandler);
}

export function routeData() {
  return createServerData$(async (_, { request, env }) => {
    const user = await getUser(request);

    if (!user) {
      throw redirect("/login");
    }

    return user;
  });
}

export default function Home() {
  const user = useRouteData<typeof routeData>();
  const params = useParams();

  const [, logoutAction] = createServerAction$((_: FormData, { request }) => logout(request));

  const [users, setUsers] = createSignal<Array<string>>([]);

  createEffect(() => {
    let websocket = room.connect(params.id);

    websocket.addEventListener("message", event => {
      const messages = JSON.parse(event.data) as Array<{ data: { users: { id: string }[]}}>;
      setUsers(messages[0].data.users.map(user => user.id));
    });

    function sendWebSocketMessage(type: string, data: { [key: string]: any }) {
      websocket.send(JSON.stringify({ type, data }));
    }

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
      <div>
        Users:
        <ul>
          <For each={users()}>{user => <li>{user}</li>}</For>
        </ul>
      </div>
      <logoutAction.Form>
        <button name="logout" type="submit">
          Logout
        </button>
      </logoutAction.Form>
    </main>
  );
}
