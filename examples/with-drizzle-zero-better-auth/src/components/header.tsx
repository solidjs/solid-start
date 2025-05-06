import { useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import { authClient } from "~/lib/auth-client";
import { useCachedSession } from "~/lib/use-cached-session";

export default function Header() {
  const location = useLocation();
  const active = (path: string) =>
    path === location.pathname ? "border-sky-600" : "border-transparent hover:border-sky-600";

  return (
    <header class="flex justify-between bg-sky-800">
      <nav>
        <ul class="container flex items-center p-3 text-gray-200">
          <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
            <a href="/">Home</a>
          </li>
        </ul>
      </nav>

      <AuthButtons />
    </header>
  );
}

function AuthButtons() {
  const session = useCachedSession();
  const location = useLocation();

  const active = (path: string) =>
    path === location.pathname ? "border-sky-600" : "border-transparent hover:border-sky-600";
  return (
    <Show
      when={session.data}
      fallback={
        <nav>
          <ul class="container flex items-center p-3 text-gray-200">
            <li class={`border-b-2 ${active("/login")} mx-1.5 sm:mx-6`}>
              <a href="/login">Login</a>
            </li>
            <li class={`border-b-2 ${active("/register")} mx-1.5 sm:mx-6`}>
              <a href="/register">Register</a>
            </li>
          </ul>
        </nav>
      }
    >
      <nav>
        <ul class="container flex items-center p-3 text-gray-200">
          <li class={"mx-1.5 border-b-2 sm:mx-6"}>
            <button type="button" onClick={() => authClient.signOut()}>
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </Show>
  );
}
