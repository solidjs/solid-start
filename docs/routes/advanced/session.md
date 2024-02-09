---
section: advanced
title: Session
order: 7
---

# Sessions

Let's see how some common authentication and authorization patterns work:

## Authentication

We need to know who the user is. This is usually done by checking the request for information. The best way for the client and server to do is using cookies.

We can use the `Request` object to access the `Cookie` header. We can then parse the cookie header to get the cookie value for a specific cookie name, for e.g. `"session"`. We can then use the cookie value to identify the session. Fortunately, Nitro already comes with helpers that enable this.

Let's look at an example of how to use the cookie to identify the user. Imagine we are implementing a `getUser` function that returns the user making the request.

```tsx {6} filename="/lib/session.ts"
export async function getUser() {
  // return user
}
```

The session cookie can be used to get the session data about the request. How the session data is stored and retrieved is up to the implementation of the `useSession`.

Let's use this `useSession` to get the session data for the request:

```tsx filename="/lib/session.ts"
import { useSession } from "vinxi/http";
export async function getUser(request: Request) {
  const session = await useSession({
    password: process.env.SESSION_SECRET
  });
}
```

Typically, we will have saved the `userId` in the session. If we don't find it, that means that this was not an authenticated request. Our `getUser` function returns a `null` when it doesn't find a user. If we find a `userId`, we can use that to get the user from the database:

```tsx filename="/lib/session.ts"
import { useSession } from "vinxi/http";

export async function getUser(): Promise<User | null> {
  const session = await useSession({
    password: process.env.SESSION_SECRET
  });
  const userId = session.data.userId;
  if (!userId) return null;
  return await hogwarts.getUser(userId);
}
```

This helper can be used in all kinds of situations wherever we want to authenticate the request. They can be used in [server functions][serverfunctions] and [API routes][apiroutes].

Let's see how we can use this in a `cache` call to make sure that only authenticated users can access the data. If the user is not authenticated, we can redirect them to the login page:

```tsx filename="/routes/api/[house]/admin.ts"
import { cache, createAsync, redirect } from "@solidjs/router";

const getStudents = cache(async (house: string) => {
  "use server";
  const user = await getUser();
  if (!user) throw redirect("/login");
  return hogwarts.getStudents(house, "*");
});

// page component
export default function Students() {
  const students = createAsync(() => getStudents());
}
```

We can log in or logout in a similar manner.

```tsx filename="/routes/session.server.ts"
import { redirect } from "@solidjs/router";
import { useSession } from "vinxi/http";

type UserSession = {
  userId?: number;
};

function getSession() {
  return useSession({
    password: process.env.SESSION_SECRET
  });
}

export async function login(formData: FormData) {
  const username = String(formData.get("username"));
  const password = String(formData.get("password"));
  // do validation
  try {
    const session = await getSession();
    const user = await db.user.findUnique({ where: { username } });
    if (!user || password !== user.password) return new Error("Invalid login");
    await session.update((d: UserSession) => (d.userId = user!.id));
  } catch (err) {
    return err as Error;
  }
  throw redirect("/");
}

export async function logout() {
  const session = await getSession();
  await session.update((d: UserSession) => (d.userId = undefined));
  throw redirect("/login");
}
```

[serverfunctions]: /docs/server-functions
[apiroutes]: /docs/api-routes
