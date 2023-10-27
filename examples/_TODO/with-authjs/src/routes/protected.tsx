import { getSession } from "@solid-auth/base";
import { signOut } from "@solid-auth/base/client";
import { Show, type VoidComponent } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$, redirect } from "solid-start/server";
import { authOptions } from "~/server/auth";

export const routeData = () => {
  return createServerData$(async (_, event) => {
    const session = await getSession(event.request, authOptions);
    if (!session) {
      throw redirect("/");
    }
    return session;
  });
};

const Protected: VoidComponent = () => {
  const session = useRouteData<typeof routeData>();
  return (
    <Show when={session()} keyed>
      {us => (
        <main>
          <h1>Protected</h1>
          {us.user?.image ? <img src={us.user?.image} /> : null}
          <span>Hey there {us.user?.name}! You are signed in!</span>
          <button
            onClick={() =>
              void signOut({
                redirectTo: "/",
                redirect: true
              })
            }
          >
            Sign Out
          </button>
        </main>
      )}
    </Show>
  );
};

export default Protected;
