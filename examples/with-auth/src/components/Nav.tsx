import { useMatch } from "@solidjs/router";
import { Show } from "solid-js";
import { useAuth } from "~/components/Context";

export default function Nav() {
  const { signedIn, logout } = useAuth();
  const isHome = useMatch(() => "/");
  const isAbout = useMatch(() => "/about");

  return (
    <nav class="fixed top-0 left-0 w-full bg-sky-800 shadow-sm z-50 flex items-center justify-between py-3 px-4 font-medium text-sm">
      <a
        href="/"
        class={`px-3 py-2 text-sky-100 uppercase transition-colors duration-200 border-b-2 ${
          isHome() ? "border-sky-300 text-white" : "border-transparent hover:text-white"
        }`}
      >
        Home
      </a>
      <a
        href="/about"
        class={`px-3 py-2 text-sky-100 uppercase transition-colors duration-200 border-b-2 ${
          isAbout() ? "border-sky-300 text-white" : "border-transparent hover:text-white"
        }`}
      >
        About
      </a>
      <Show
        when={signedIn()}
        fallback={
          <a
            href="/login"
            class="ml-auto px-4 py-2 text-sky-100 bg-sky-700 border border-sky-600 rounded-md hover:bg-sky-600 hover:text-white focus:outline-none transition-colors duration-200"
          >
            Login
          </a>
        }
      >
        <form action={logout} method="post" class="ml-auto">
          <button
            type="submit"
            class="px-4 py-2 text-sky-100 bg-sky-700 border border-sky-600 rounded-md hover:bg-sky-600 hover:text-white focus:outline-none transition-colors duration-200"
          >
            Sign Out
          </button>
        </form>
      </Show>
    </nav>
  );
}
