import server, { redirect } from "solid-start/server";
import { createRouteResource } from "solid-start/router";
import { useRouteData } from "solid-start/router";
import { createAction } from "solid-start/form";
import { getUser, logout } from "~/db/session";

export function routeData() {
  return createRouteResource(
    server(async ({ request }) => {
      const user = await getUser(request);

      if (!user) {
        throw redirect("/login");
      }

      return user;
    })
  );
}

export default function Home() {
  const user = useRouteData<ReturnType<typeof routeData>>();
  const logoutAction = createAction(server(() => logout(server.request)));

  return (
    <main class="w-full p-4 space-y-2">
      <h1 class="font-bold text-3xl">Hello {user()?.username}</h1>
      <h3 class="font-bold text-xl">Message board</h3>
      <logoutAction.Form>
        <button name="logout" type="submit">
          Logout
        </button>
      </logoutAction.Form>
    </main>
  );
}
