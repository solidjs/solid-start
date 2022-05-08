import server, { redirect } from "solid-start/server";
import { createRouteResource } from "solid-start/router";

import { createAction } from "solid-start/form";
import { getUser, logout } from "~/db/session";

export default function Home() {
  const [user] = createRouteResource(
    server(async () => {
      let user = await getUser(server.request);

      if (!user) {
        throw redirect("/login");
      }

      return user;
    })
  );

  const logout = createAction(
    server(async function () {
      return await logout(server.request);
    })
  );

  return (
    <main class="w-full p-4 space-y-2">
      <h1 class="font-bold text-3xl">Hello {user()?.username}</h1>
      <h3 class="font-bold text-xl">Message board</h3>
      <logout.Form>
        <button name="logout" type="submit">
          Logout
        </button>
      </logout.Form>
    </main>
  );
}
