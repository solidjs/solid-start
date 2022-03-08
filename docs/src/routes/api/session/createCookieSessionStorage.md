<title>createCookieSessionStorage()</title>

##### `createCookieSessionStorage()` gives you a `SessionStorage` that uses cookies to store ALL the user session data

<div class="text-xl">

```ts twoslash
import { createCookieSessionStorage } from "solid-start/session";
let options = {
  cookie: {
    name: "session",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secure: true,
    httpOnly: true
  }
} as const;
// ---cut---
const sessionStorage = createCookieSessionStorage(options);
```

</div>

<ssr>

- [Usage](#usage)
  - [Loading route data on the server](#example)
  - [Forms with server functions](/api/forms/createForm#forms-with-server-functions)

</ssr>

- [Reference](#reference)

  - [`server(serverFn): ServerFunction`](#hello-world)
  - [`ServerFunction(...args)`](#form-controller)
    - [`ServerFunction.action`](#form-controller-form)
    - [`ServerFunction.url`](#form-controller-form)

- [Troublehooting](#troublehooting)

---

## Usage

For purely cookie-based sessions (where the session data itself is stored in the session cookie with the browser, see cookies) you can use `createCookieSessionStorage()`.

The main advantage of cookie session storage is that you don't need any additional backend services or databases to use it. It can also be beneficial in some load balanced scenarios. However, cookie-based sessions may not exceed the browser's max allowed cookie length (typically 4kb).

The downside is that you have to `commitSession` in almost every loader and action. If your loader or action changes the session at all, it must be committed. That means if you session.flash in an action, and then session.get in another, you must commit it for that flashed message to go away. With other session storage strategies you only have to commit it when it's created (the browser cookie doesn't need to change because it doesn't store the session data, just the key to find it elsewhere).

## Reference

### `createCookieSessionStorage(options)`
