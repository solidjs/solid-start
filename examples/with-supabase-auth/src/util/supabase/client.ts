import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
  );

export const supabase = createClient();

