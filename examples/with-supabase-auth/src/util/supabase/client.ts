import { action, query, redirect } from "@solidjs/router";
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
  );

export const signOutAction = action(async () => {
  "use client";
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
}, "signOutAction");

/**
 * Create a brower-based client and get the user.
 * Suitable for conditional rendering based on user authentication.
 */
export const getUser = query(async () => {
  "use client";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}, "user");