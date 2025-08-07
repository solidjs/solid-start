import { useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import useOAuthLogin from "start-oauth/client";
import { passwdSignIn } from "~/lib";

export default function Login() {
  return (
    <main class="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700 p-4">
      <div class="w-full max-w-md space-y-8 text-center">
        <h1 class="text-6xl text-sky-700 font-thin uppercase">Sign in</h1>
        <Password />
        <OAuth />
      </div>
    </main>
  );
}

function Password() {
  const status = useSubmission(passwdSignIn);

  return (
    <form action={passwdSignIn} method="post" class="space-y-4">
      <label for="email" class="block text-left">
        <span class="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          placeholder="john@doe.com"
          required
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </label>
      <label for="password" class="block text-left">
        <span class="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          required
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </label>
      <button
        type="submit"
        class="w-full py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded transition-colors duration-200"
      >
        Sign in
      </button>
      <Show when={status.error} keyed>
        {({ message }) => <p class="text-red-600 text-sm mt-2">{message}</p>}
      </Show>
    </form>
  );
}

function OAuth() {
  const login = useOAuthLogin();

  return (
    <div class="space-y-2">
      <p class="text-lg font-medium">Or sign in with:</p>
      <div class="flex justify-center gap-4">
        <a
          href={login("discord")}
          rel="external"
          class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        >
          Discord
        </a>
      </div>
    </div>
  );
}
