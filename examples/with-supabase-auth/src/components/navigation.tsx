import { A, useAction, useLocation } from "@solidjs/router";
import { createResource, Suspense } from "solid-js";
import { createClient, signOutAction } from "~/util/supabase/client";

export function Navigation() {
  const location = useLocation();
  const [user] = createResource(async () => {
    "use client";
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  });

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
        <li class={`border-b-2 ${active("/sign-up")} mx-1.5 sm:mx-6`}>
          <A href="/sign-up">Sign Up</A>
        </li>
        <li class={`border-b-2 ${active("/sign-in")} mx-1.5 sm:mx-6`}>
          <A href="/sign-in">Sign In</A>
        </li>
        <Suspense fallback={<li>Loading...</li>}>
          {user() ? (
            <li class={`border-b-2 ${active("nonsense-route")} mx-1.5 sm:mx-6`}>
              <button onClick={() => signOut()}>Sign Out</button>
            </li>
          ) : null}
        </Suspense>
      </ul>
    </nav>
  );
}
