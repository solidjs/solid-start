import type { Zero } from "@rocicorp/zero";
import { createZero } from "@rocicorp/zero/solid";
import { type Accessor, type ParentProps, createContext, createMemo, useContext } from "solid-js";
import { useCachedSession } from "~/lib/use-cached-session";
import { schema } from "~/lib/zero-schema";

const Context = createContext();

export function ZeroContext(props: ParentProps) {
  const session = useCachedSession();

  const z = createMemo(() => {
    const jwtStorageKey = `jwt-${session.data?.user.id}`;

    console.log("createZero", session.data?.user.id);
    return createZero({
      userID: session.data?.user.id ?? "null",
      auth: async error => {
        if (error === "invalid-token") {
          sessionStorage.removeItem(jwtStorageKey);
        }

        let token = sessionStorage.getItem(jwtStorageKey);
        if (!token) {
          if (!session.data?.user) return undefined;
          const response = await fetch("/api/auth/token");
          const data = await response.json();
          token = data.token;
          if (!token) throw new Error("No token found");
          sessionStorage.setItem(jwtStorageKey, token);
        }
        console.log("token", jwtStorageKey, token);
        return token ?? undefined;
      },
      server: import.meta.env.VITE_PUBLIC_SERVER,
      schema,
      kvStore: "mem"
    });
  });

  return <Context.Provider value={z}>{props.children}</Context.Provider>;
}

export function useZero() {
  const z = useContext(Context);
  return z as Accessor<Zero<typeof schema>>;
}
