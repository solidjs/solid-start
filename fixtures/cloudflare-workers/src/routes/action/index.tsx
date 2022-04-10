import server, { redirect } from "solid-start/server";
import { createAction, createForm } from "solid-start/form";
import { createComputed, createResource } from "solid-js";
import { getUser, logout } from "~/db/session";
import { useNavigate, useRouteData } from "solid-app-router";

export function routeData() {
  return createResource(
    server(async () => {
      if (!(await getUser(server.request))) {
        throw redirect("/action/login");
      }

      return {};
    })
  );
}

export default function Home() {
  const [data] = useRouteData<ReturnType<typeof routeData>>();
  createComputed(data);
  const navigate = useNavigate();

  const [_, logoutAction] = createAction(
    server(async () => {
      return await logout(server.request);
    })
  );

  return (
    <main class="w-full p-4 space-y-2">
      <h1 class="font-bold text-xl">Message board</h1>
      <button
        name="logout"
        onClick={() =>
          logoutAction().then(response => {
            navigate("/action/login");
          })
        }
      >
        Logout
      </button>
    </main>
  );
}
