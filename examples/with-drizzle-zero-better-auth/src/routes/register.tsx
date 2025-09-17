import { action, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import { authClient } from "~/lib/auth-client";

const onRegister = action(async (formData: FormData) => {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await authClient.signUp.email({
    email,
    name: username,
    password,
    username
  });
  if (error) {
    throw error;
  }
  return { success: true };
}, "register");

export default function Register() {
  const submission = useSubmission(onRegister);

  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h1 class="max-6-xs my-16 font-thin text-6xl text-sky-700 uppercase">Register</h1>
      <form action={onRegister} method="post" class="m-auto grid w-fit gap-2">
        <label class="grid justify-items-start">
          Username
          <input type="text" name="username" class="border p-2" />
        </label>
        <label class="grid justify-items-start">
          Email
          <input type="email" name="email" class="border p-2" />
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
          {submission.pending ? "Registering..." : "Register"}
        </button>
      </form>
    </main>
  );
}
