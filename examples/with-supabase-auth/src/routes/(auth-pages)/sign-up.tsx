import { A, useSearchParams } from "@solidjs/router";
import { FormMessage, Message } from "~/components/form-message";
import { signUpAction } from "~/util/supabase/actions";

export default function Signup() {
    const [searchParams] = useSearchParams<Message>();
    // if (searchParams && "message" in searchParams) {
    //     return (
    //         <div class="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
    //             <FormMessage message={searchParams} />
    //         </div>
    //     );
    // }
    return (
        <main class="text-center mx-auto text-gray-700 dark:text-gray-500 p-4">
            <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">Sign Up</h1>
            <form action={signUpAction} class="flex flex-col min-w-64 max-w-64 mx-auto" method="post">
                <p class="text-sm text text-foreground">
                    Already have an account?{" "}
                    <A class="text-primary font-medium underline" href="/sign-in">
                        Sign in
                    </A>
                </p>
                <div class="flex flex-col text-left gap-2 [&>input]:mb-3 mt-8">
                    <label for="email">Email</label>
                    <input name="email" type="email" class="text-black p-2 rounded" placeholder="you@example.com" required />
                    <label for="password">Password</label>
                    <input
                        type="password"
                        name="password"
                        class="text-black p-2 rounded"
                        placeholder="Your password"
                        minLength={6}
                        required
                    />
                    <button class="p-2  border border-gray-300 hover:bg-white/10" type="submit" formAction={signUpAction}>
                        Sign up
                    </button>
                    <FormMessage success={searchParams.success} error={searchParams.error} message={searchParams.message} />
                </div>
            </form>
        </main>
    );
}
