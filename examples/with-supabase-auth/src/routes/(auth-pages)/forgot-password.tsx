import { A, useSearchParams } from "@solidjs/router";
import { FormMessage, Message } from "~/components/form-message";
import { forgotPasswordAction } from "~/util/supabase/actions";


export default function ForgotPassword() {
    const [searchParams] = useSearchParams<Message>();
    return (
        <main class="text-center mx-auto text-gray-700 p-4">
            <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">Reset Password</h1>
            <form action={forgotPasswordAction} class="flex-1 flex flex-col w-full gap-2 text-foreground [&>input]:mb-6 min-w-64 max-w-64 mx-auto" method="post">
                <div>
                    <p class="text-sm text-foreground">
                        Already have an account?{" "}
                        <A class="text-primary underline" href="/sign-in">
                            Sign in
                        </A>
                    </p>
                </div>
                <div class="flex flex-col text-left gap-2 [&>input]:mb-3 mt-8">
                    <label for="email">Email</label>
                    <input name="email" class="text-black p-2 rounded" placeholder="you@example.com" required />
                    <button type="submit" formAction={forgotPasswordAction}>
                        Reset Password
                    </button>
                    <FormMessage success={searchParams.success} error={searchParams.error} message={searchParams.message} />
                </div>
            </form>
        </main>
    );
}
