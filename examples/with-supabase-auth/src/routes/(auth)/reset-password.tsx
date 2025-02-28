import { type RouteDefinition, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import { getProtectedUser, resetPasswordAction } from "~/util/supabase/actions";

export const route = {
  preload() {
    getProtectedUser();
  }
} satisfies RouteDefinition;

export default function ResetPassword() {
  const resetPassword = useSubmission(resetPasswordAction);
  return (
    <main class="text-center mx-auto text-gray-700 dark:text-gray-500 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">Reset Password</h1>
      <form
        action={resetPasswordAction}
        class="flex-1 flex flex-col w-full gap-2 text-foreground [&>input]:mb-6 min-w-64 max-w-64 mx-auto"
        method="post"
      >
        <div>
          <p class="text-sm text-foreground">Please enter your new password below.</p>
        </div>
        <div class="flex flex-col text-left gap-2 [&>input]:mb-3 mt-8">
          <label for="password">New password</label>
          <input
            type="password"
            name="password"
            class="text-black p-2 rounded"
            placeholder="New password"
            required
          />
          <label for="confirmPassword">Confirm password</label>
          <input
            type="password"
            name="confirmPassword"
            class="text-black p-2 rounded"
            placeholder="Confirm password"
            required
          />
          <button
            class="p-2  border border-gray-300 hover:bg-white/10"
            formAction={resetPasswordAction}
            type="submit"
          >
            Reset password
          </button>
          <Show when={resetPassword.result}>
            {result => (
              <p class="w-full border p-2 mt-2 rounded-md border-red-600 text-red-600">
                {result().message}
              </p>
            )}
          </Show>
        </div>
      </form>
    </main>
  );
}
