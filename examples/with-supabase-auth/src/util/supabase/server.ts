import { createServerClient as _createServerClient } from "@supabase/ssr";
import { RequestEvent } from "solid-js/web";
import { parseCookies, setCookie } from "vinxi/http";

export const createServerClient = (event: RequestEvent) => {
  return _createServerClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // @ts-expect-error - `nativeEvent` is not defined in the type, but does exist.
          return Object.entries(parseCookies(event.nativeEvent)).map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet: { name: string, value: string }[]) {
          cookiesToSet.forEach(({ name, value }: { name: string, value: string }) => {
            // @ts-expect-error - `nativeEvent` is not defined in the type, but does exist.
            setCookie(event.nativeEvent, name, value)
          });
        },
      },
    },
  );
};
