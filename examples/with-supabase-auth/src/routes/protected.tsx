import { A, createAsync, type RouteDefinition } from "@solidjs/router";
import { getProtectedUser } from "~/util/supabase/actions";

export const route = {
    preload() { getProtectedUser() }
} satisfies RouteDefinition;

export default function Protected() {
    const user = createAsync(() => getProtectedUser(), { deferStream: true });
    return (
        <main class="text-center mx-auto text-gray-700 dark:text-gray-500 p-4">
            <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">Protected Page</h1>
            <p class="mt-8">
                Visit{" "}
                <a href="https://solidjs.com" target="_blank" class="text-sky-600 hover:underline">
                    solidjs.com
                </a>{" "}
                to learn how to build Solid apps.
            </p>
            <p class="my-4">
                This page is protected. You must be logged in to view it.
            </p>
            <p class="my-4">
                <A href="/" class="text-sky-600 hover:underline">
                    Home
                </A>
                {" - "}
                <A href="/about" class="text-sky-600 hover:underline">
                    About
                </A>
                {" - "}
                <A href="/reset-password" class="text-sky-600 hover:underline">
                    Reset Password
                </A>
            </p>
        </main>
    );
}
