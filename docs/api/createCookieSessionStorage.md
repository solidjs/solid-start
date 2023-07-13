---
section: api
title: createCookieSessionStorage
order: 8
subsection: Session
active: true
---

# createCookieSessionStorage

##### `createCookieSessionStorage` creates a `SessionStorage` that saves all the session data in a cookie.

<div class="text-lg">

```tsx twoslash
import { createCookieSessionStorage } from "solid-start";
// ---cut---
const storage = createCookieSessionStorage();
```

</div>

<table-of-contents></table-of-contents>

## Usage

```twoslash include cookie
// @module: esnext
const process = { env: {
  NODE_ENV: "",
  SESSION_SECRET: ""
}}
// ---cut---
import { createCookieSessionStorage } from 'solid-start';

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

### Creating a `SessionStorage`

```tsx twoslash
// @include: cookie
```

### Reading the session data of the current request

```tsx twoslash {6}
// @include: cookie
// ---cut---
async function getUserId(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"));

  const userId = session.get("userId");
  return userId;
}
```

### Writing the session data for the current request

```tsx twoslash {5,8}
// @include: cookie
// ---cut---
async function login(request: Request, userId: string) {
  const session = await storage.getSession(request.headers.get("Cookie"));
  session.set("userId", userId);
  const response = new Response("Logged in", {
    headers: {
      "Set-Cookie": await storage.commitSession(session)
    }
  });
}
```

### Deleting the session data for the current request

```tsx twoslash {10}
// @include: cookie
// ---cut---
import { redirect } from "solid-start";

async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get("Cookie"));

  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session)
    }
  });
}
```

### Creating a new session

```tsx twoslash {2,6}
// @include: cookie
// ---cut---
async function signUp(request: Request, userId: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return new Response("Signed Up", {
    headers: {
      "Set-Cookie": await storage.commitSession(session)
    }
  });
}
```
