---
section: advanced
title: Session
order: 7
---

# Sessions

Let's see how some common authentication and authorization patterns work:

## Authentication

We need to know who the user is. This is usually done by checking the request for information. The best way for the client and server to do is using cookies.

We can use the `Request` object to access the `Cookie` header. We can then parse the cookie header to get the cookie value for a specific cookie name, for e.g. `"session"`. We can then use the cookie value to identify the session.

```twoslash include hogwarts
const hogwarts = {
  getStudents(house: string, year: string) {
    return [
      { name: "Harry Potter", house, year },
      { name: "Hermione Granger", house, year },
      { name: "Ron Weasley", house, year },
    ];
  },
  getUser(id: string) {
    return {
      name: "Severus Snape",
      id,
    };
  },
  getHouseMaster(house: string) {
    return {
      name: "Severus Snape",
      house,
      id: "5"
    };
  },
};
type User = {}
```

```twoslash include cookie
// @module: esnext
// ---cut---

const process = { env: {
  NODE_ENV: "",
  SESSION_SECRET: ""
}}

// ---cut---
import { createCookieSessionStorage } from "solid-start";

const storage = createCookieSessionStorage({
  cookie: {
    name: "session",
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true
  }
});
```

```twoslash include getUser
export async function getUser(request: Request): Promise<User | null> {
  const cookie = request.headers.get("Cookie") ?? ""
  const session = await storage.getSession(cookie);
  const userId = session.get("userId");
  if (!userId) return null;
  return await hogwarts.getUser(userId);
}
```

Let's look at an example of how to use the cookie to identify the user. Imagine we are implementing a `getUser` function that returns the user making the request.

```tsx twoslash {6} filename="/lib/session.ts"
// @include: hogwarts

// ---cut---
export async function getUser(request: Request) {
  const cookie = request.headers.get("Cookie") ?? "";
}
```

We use a `SessionStorage` to manage the session data on the server. We can create one using the various storage factories we export: `createCookieSessionStorage`, `createMemorySessionStorage`, `createSessionStorage`.

```tsx twoslash filename="/lib/session.ts"
// @include: hogwarts

// ---cut---
// @include: cookie
```

The `SessionStorage` can be passed the cookie to get the session data about the request. How the session data is stored and retrieved is up to the implementation of the `SessionStorage`.

It can either save all the state within the `cookie` itself, which `createCookieSessionStorage` does, or it can save the session data in a database, and the cookie merely contains a session id.

Let's use this `storage` to get the session data for the request:

```tsx twoslash {3} filename="/lib/session.ts"
// @include: hogwarts
// @include: cookie

// ---cut---
export async function getUser(request: Request) {
  const cookie = request.headers.get("Cookie") ?? "";
  const session = storage.getSession(cookie);
}
```

Typically, we will have saved the `userId` in the session. If we don't find it, that means that this was not an authenticated request. Our `getUser` function returns a `null` when it doesn't find a user. If we find a `userId`, we can use that to get the user from the database:

```tsx twoslash {4-6} filename="/lib/session.ts"
// @include: hogwarts
// @include: cookie

// ---cut---
// @include: getUser
```

This helper can be used in all kinds of situations wherever we want to authenticate the request. They can be used in [server functions][serverfunctions] and [API routes][apiroutes], as well the `createServerData$` and `createServerAction$` primitives.

Let's see how we can use this in a `createServerData$` call to make sure that only authenticated users can access the data. If the user is not authenticated, we can redirect them to the login page:

```tsx twoslash {7-8} filename="/routes/api/[house]/admin.ts"
// @include: hogwarts
// @include: cookie
// @include: getUser

// ---cut---
import { createServerData$, redirect } from "solid-start/server";
import { RouteDataArgs } from "solid-start";

export function routeData({ params }: RouteDataArgs) {
  return createServerData$(
    async (house, event) => {
      const user = await getUser(event.request);
      if (!user) throw redirect("/login");
      return {
        students: hogwarts.getStudents(house, "*")
      };
    },
    { key: () => params.house }
  );
}
```

```tsx filename="/routes/session.server.ts"
// @module: esnext
// ---cut---
import { redirect } from "solid-start/server";
import { createCookieSessionStorage } from "solid-start/session";

const db = {
  user: {} as any
};

type LoginForm = {
  username: string;
  password: string;
};

export async function register({ username, password }: LoginForm) {
  return db.user.create({
    data: { username: username, password }
  });
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;
  const isCorrectPassword = password === user.password;
  if (!isCorrectPassword) return null;
  return user;
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_session",
    // secure doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: process.env.NODE_ENV === "production",
    secrets: ["hello"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true
  }
});

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await db.user.findUnique({ where: { id: Number(userId) } });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session)
    }
  });
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session)
    }
  });
}
```

[serverfunctions]: /docs/server-functions
[apiroutes]: /docs/api-routes
