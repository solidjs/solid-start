<title>createCookieSessionStorage()</title>

##### `createCookieSessionStorage()` gives you a `SessionStorage` that uses cookies to store ALL the user session data

<div class="text-xl">

```ts twoslash
import { createCookieSessionStorage } from "solid-start/session";
// ---cut---
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "session",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secure: true,
    httpOnly: true
  }
});
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
