import { getSession } from "@solid-mediakit/auth";
import { signOut } from "@solid-mediakit/auth/client";
import { createAsync, redirect } from "@solidjs/router";
import { Show, type VoidComponent } from "solid-js";
import { getRequestEvent } from "solid-js/web";
import { authOptions } from "~/server/auth";


const Protected: VoidComponent = () => {
  const session = createAsync(async () => {
    "use server";
    const event = getRequestEvent();
    const session = await getSession(event!.request, authOptions);
    if (!session) {
      throw redirect("/");
    }
    return session;
  });


  
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
