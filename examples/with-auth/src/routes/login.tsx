import { Title } from "@solidjs/meta";
import { useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import { useOAuthLogin } from "start-oauth";
import { formLogin } from "~/auth";
import { Discord } from "~/components/Icons";

export default function Login() {
  const login = useOAuthLogin();

  return (
    <main>
      <Title>Sign In</Title>
      <h1>Sign in</h1>
      <div class="space-y-6 font-medium">
        <PasswordLogin />
        <div class="flex items-center w-full text-xs">
          <span class="flex-grow bg-gray-300 h-[1px]" />
          <span class="flex-grow-0 mx-2 text-gray-500">Or continue with</span>
          <span class="flex-grow bg-gray-300 h-[1px]" />
        </div>
        <a
          href={login("discord")}
          rel="external"
          class="group w-full px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-[#5865F2] hover:border-gray-300 focus:outline-none transition-colors duration-300 flex items-center justify-center gap-2.5 text-gray-700 hover:text-white"
        >
          <Discord class="h-5 fill-[#5865F2] group-hover:fill-white duration-300" />
          Sign in with Discord
        </a>
      </div>
    </main>
  );
}

function PasswordLogin() {
  const submission = useSubmission(formLogin);

  return (
    <form action={formLogin} method="post" class="space-y-4 space-x-12">
      <label for="email" class="block text-left w-full">
        Email
        <input
          id="email"
          name="email"
          type="email"
          autocomplete="email"
          placeholder="john@doe.com"
          required
          class="bg-white mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </label>
      <label for="password" class="block text-left w-full">
        Password
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          minLength={6}
          required
          class="bg-white mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </label>
      <button
        type="submit"
        disabled={submission.pending}
        class="w-full px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg shadow-sky-500/25"
      >
        Submit
      </button>
      <Show when={submission.error} keyed>
        {({ message }) => <p class="text-red-600 mt-2 text-xs text-center">{message}</p>}
      </Show>
    </form>
  );
}
