---
section: api
title: createSessionStorage
order: 9
subsection: Session
active: true
---

# createSessionStorage

##### `createSessionStorage` creates a server-side session storage that persists `session-id` in a cookie.

<div class="text-lg">

```tsx twoslash
import { createSessionStorage, SessionIdStorageStrategy } from 'solid-start';

let storageOptions: SessionIdStorageStrategy = {} as unknown as SessionIdStorageStrategy;
// ---cut---
const storage = createSessionStorage(storageOptions);
```

</div>

<table-of-contents></table-of-contents>

## Usage

```twoslash include cookie
// @module: esnext
import { createSessionStorage } from 'solid-start';

const storage = createSessionStorage({
  cookie: {
    name: "session",
    secure: import.meta.env.PROD,
    secrets: [import.meta.env.VITE_SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true
  },
  async createData(data, expires) {
    return db.sessions.create({ data: { ...data, expires } })
  },
  async updateData(id, data, expires) {
    return db.sessions.update({ where: { id }, data: { ...data, expires } });
  },
  async deleteData(id) {
    return db.sessions.delete({ where: { id } });
  },
  async readData(id) {
    return db.sessions.findUnique({ where: { id } });
  }
});
```

### Creating a `SessionStorage`

```tsx twoslash
let db: any = {};
// ---cut---
// @include: cookie
```

### Reading the session data of the current request

```tsx twoslash {6}
let db: any = {};
// @include: cookie
// ---cut---
async function getUserId(request: Request) {
  const session = await storage.getSession(
    request.headers.get('Cookie')
  );

  const userId = session.get('userId');
  return userId;
}
```

### Writing the session data for the current request

```tsx twoslash {5,8}
let db: any = {};
// @include: cookie
// ---cut---
async function login(request: Request, userId: string) {
  const session = await storage.getSession(
    request.headers.get('Cookie')
  );
  session.set('userId', userId);
  const response = new Response('Logged in', {
    headers: {
      'Set-Cookie': await storage.commitSession(session)
    }
  });
}
```

### Deleting the session data for the current request

```tsx twoslash {10}
let db: any = {};
// @include: cookie
// ---cut---
import { redirect } from 'solid-start';

async function logout(request: Request) {
  const session = await storage.getSession(
    request.headers.get('Cookie')
  );

  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session)
    }
  });
}
```

### Creating a new session

```tsx twoslash {2,6}
let db: any = {};
// @include: cookie
// ---cut---
async function signUp(request: Request, userId: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return new Response('Signed Up', {
    headers: {
      "Set-Cookie": await storage.commitSession(session)
    }
  });
}
```
