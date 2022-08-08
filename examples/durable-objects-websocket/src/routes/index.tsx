import { useRouteData } from "@solidjs/router";
import { createEffect } from "solid-js";
import server, { createServerAction, createServerData, redirect } from "solid-start/server";
import { getUser, logout } from "~/session";

export function routeData() {
  return createServerData(async (_, { request, env }) => {
    console.log(env);
    const user = await getUser(request);

    if (!user) {
      throw redirect("/login");
    }

    return user;
  });
}

export default function Home() {
  const user = useRouteData<typeof routeData>();
  const logoutAction = createServerAction((_, { request }) => logout(request));

  const join = server(async function () {
    console.log(this.env);

    if (this.request.headers.get("upgrade") === "websocket") {
      const url = new URL(this.request.url);
      const durableObjectId = this.env.DO_WEBSOCKET.idFromName(url.pathname);
      const durableObjectStub = this.env.DO_WEBSOCKET.get(durableObjectId);
      const response = await durableObjectStub.fetch(this.request);
      console.log(response, response.headers, response.status);
      return response;
    }
  });

  createEffect(() => {
    let websocket = new WebSocket(`${location.origin.replace(/^http/, "ws")}${join.url}`);
    websocket.onopen = console.log;

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
    setInterval(() => {
      try {
        const id = self.crypto.randomUUID();
        sendWebSocketMessage("ping", { id, lastPingMs: 0 });
      } catch (e) {}
    }, 1000);
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
