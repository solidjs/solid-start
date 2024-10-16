import { A, useSearchParams } from "@solidjs/router";
import { FormMessage, Message } from "~/components/form-message";
import { signInAction } from "~/util/supabase/actions";

export default function Login() {
    const [searchParams] = useSearchParams<Message>();
    return (
        <main class="text-center mx-auto text-gray-700 p-4">
            <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">Sign In</h1>
            <form action={signInAction} class="flex flex-col min-w-64 max-w-64 mx-auto" method="post">
                <p class="text-sm text-foreground">
                    Don't have an account?{" "}
                    <A class="text-foreground font-medium underline" href="/sign-up">
                        Sign up
                    </A>
                </p>
                <div class="flex flex-col text-left gap-2 [&>input]:mb-3 mt-8">
                    <label for="email">Email</label>
                    <input name="email" type="email" class="text-black p-2 rounded" placeholder="you@example.com" required />
                    <div class="flex justify-between items-center">
                        <label for="password">Password</label>
                        <A
                            class="text-foreground underline"
                            href="/forgot-password"
                        >
                            Forgot Password?
                        </A>
                    </div>
                    <input
                        type="password"
                        name="password"
                        class="text-black p-2 rounded"
                        placeholder="Your password"
                        required
                    />
                    <button formAction={signInAction}>
                        Sign in
                    </button>
                    <FormMessage success={searchParams.success} error={searchParams.error} message={searchParams.message} />
                </div>
            </form>
        </main>
    );
}
