import server, { redirect, createServerResource, createServerAction } from "solid-start/server";
import { createComputed } from "solid-js";
import { getUser, logout } from "~/db/session";
import { useNavigate, useRouteData } from "solid-start/router";

export function routeData() {
  return createServerResource(async (_, { request }) => {
    if (!(await getUser(request))) {
      throw redirect("/action/login");
    }

    return {};
  });
}

export default function Home() {
  const data = useRouteData<ReturnType<typeof routeData>>();
  createComputed(data);
  const navigate = useNavigate();

  const logoutAction = createServerAction(() => logout(server.request));

  return (
    <main class="w-full p-4 space-y-2">
      <h1 class="font-bold text-xl">Message board</h1>
      <button name="logout" onClick={() => logoutAction().then(() => navigate("/action/login"))}>
        Logout
      </button>
    </main>
  );
}
