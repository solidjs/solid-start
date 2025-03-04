import { action, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import { authClient } from "~/lib/auth-client";

const onLogin = action(async (formData: FormData) => {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const { error } = await authClient.signIn.username({
    username,
    password
  });
  if (error) {
    throw error;
  }

  return { success: true };
}, "login");

export default function Login() {
  const submission = useSubmission(onLogin);

  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h1 class="max-6-xs my-16 font-thin text-6xl text-sky-700 uppercase">Login</h1>
      <form action={onLogin} method="post" class="m-auto grid w-fit gap-2">
        <label class="grid justify-items-start">
          Username
          <input type="text" name="username" class="border p-2" />
        </label>
        <label class="grid justify-items-start">
          Password
          <input type="password" name="password" class="border p-2" />
        </label>
        <Show when={submission.error}>
          <div class="mt-4 text-red-700">Error: {submission.error.message}</div>
        </Show>
        <button
          type="submit"
          class="mt-4 bg-sky-700 p-2 text-white hover:bg-sky-800"
          disabled={submission.pending}
        >
          {submission.pending ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
