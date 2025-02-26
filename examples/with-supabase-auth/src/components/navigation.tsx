import { A, useAction, useLocation } from "@solidjs/router";
import { signOutAction } from "~/util/supabase/actions";
import { useSupabaseSession } from "~/util/supabase/session-context";

export function Navigation() {
  const location = useLocation();
  const session = useSupabaseSession();

  const signOut = useAction(signOutAction);

  const active = (path: string) =>
    path == location.pathname ? "border-sky-600" : "border-transparent hover:border-sky-600";

  return (
    <nav class="bg-sky-800">
      <ul class="container flex items-center p-3 text-gray-200">
        <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
          <A href="/">Home</A>
        </li>
        <li class={`border-b-2 ${active("/about")} mx-1.5 sm:mx-6`}>
          <A href="/about">About</A>
        </li>
        <li class={`border-b-2 ${active("/protected")} mx-1.5 sm:mx-6`}>
          <A href="/protected">Protected</A>
        </li>
        {session() ?
          <li class={`border-b-2 ${active("nonsense-route")} mx-1.5 sm:mx-6`}>
            <button onClick={() => signOut()}>Sign Out</button>
          </li> :
          <>
            <li class={`border-b-2 ${active("/sign-up")} mx-1.5 sm:mx-6`}>
              <A href="/sign-up">Sign Up</A>
            </li>
            <li class={`border-b-2 ${active("/sign-in")} mx-1.5 sm:mx-6`}>
              <A href="/sign-in">Sign In</A>
            </li>
          </>
        }
      </ul>
    </nav>
  );
}
