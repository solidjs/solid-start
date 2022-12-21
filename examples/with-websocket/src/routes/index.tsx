import { createEffect, createSignal, onCleanup } from "solid-js";
import { useRouteData } from "solid-start";
import server$, { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { createWebSocketServer } from "solid-start/websocket";
import { getUser, logout } from "~/session";

const pingPong = createWebSocketServer(
  server$(function (webSocket) {
    webSocket.addEventListener("message", async msg => {
      try {
        // Parse the incoming message
        let incomingMessage = JSON.parse(msg.data);
        console.log(incomingMessage);

        switch (incomingMessage.type) {
          case "ping":
            webSocket.send(
              JSON.stringify([
                {
                  type: "pong",
                  data: {
                    id: incomingMessage.data.id,
                    time: Date.now()
                  }
                }
              ])
            );
            break;
        }
      } catch (err: any) {
        // Report any exceptions directly back to the client. As with our handleErrors() this
        // probably isn't what you'd want to do in production, but it's convenient when testing.
        webSocket.send(JSON.stringify({ error: err.stack }));
      }
    });
  })
);

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
  const [, logoutAction] = createServerAction$((_: FormData, { request }) => logout(request));
  const [lastPing, setLastPing] = createSignal(Date.now().toString());
  const increment = createServerAction$(
    async (_, { env }) => {
      await env.app.put("key", `${Number(await server$.env.app.get("key")) + 1}`);
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
      let message = messages[0];
      switch (message.type) {
        case "pong":
          setLastPing(message.data.time);
      }
    });

    function sendWebSocketMessage(type: string, data: { [key: string]: any }) {
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
    <main>
      <h1>Hello {user()?.username}</h1>
      <h3>Message board</h3>
      <logoutAction.Form>
        <button name="logout" type="submit">
          Logout
        </button>
      </logoutAction.Form>
    </main>
  );
}
