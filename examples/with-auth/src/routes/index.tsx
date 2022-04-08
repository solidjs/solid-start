import server, { redirect } from "solid-start/server";
import { createForm } from "solid-start/form";
import { createComputed, createResource } from "solid-js";
import { getUser, logout } from "~/db/session";
import { useRouteData } from "solid-app-router";

export function routeData() {
  return createResource(
    server(async () => {
      if (!(await getUser(server.request))) {
        throw redirect("/login", {
          context: this
        });
      }

      return {};
    })
  );
}

export default function Home() {
  const [data] = useRouteData<ReturnType<typeof routeData>>();
  createComputed(data);

  const logoutForm = createForm(
    server(async function () {
      return await logout(server.request);
    })
  );

  return (
    <main class="w-full p-4 space-y-2">
      <h1 class="font-bold text-xl">Message board</h1>
      <logoutForm.Form>
        <button name="logout" type="submit">
          Logout
        </button>
      </logoutForm.Form>
    </main>
  );
}
