import { redirect } from "@solidjs/router";
import { RequestEvent } from "solid-js/web";
import { createServerClient } from "~/util/supabase/server";

export async function GET(request: RequestEvent) {
    // The `/auth/callback` route is required for the server-side auth flow implemented
    // by the SSR package. It exchanges an auth code for the user's session.
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const requestUrl = new URL(request.request.url);
    const code = requestUrl.searchParams.get("code");
    const origin = requestUrl.origin;
    const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

    if (code) {
        const supabase = createServerClient(request);
        await supabase.auth.exchangeCodeForSession(code);
    }

    if (redirectTo) {
        return redirect(`${origin}${redirectTo}`);
    }

    // URL to redirect to after sign up process completes
    return redirect(`${origin}/protected`);
}