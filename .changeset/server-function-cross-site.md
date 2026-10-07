---
"@solidjs/start": patch
---

Reject cross-site server function requests with a `403`.

A `"use server"` function could be invoked from another site with the visitor's cookies, over a GET or a form POST, because the request's origin was not checked. Server function requests are now allowed only from the same origin or the same site. The check trusts the `Sec-Fetch-Site` header (`cross-site` is refused; `same-origin`, `same-site` and `none` are allowed) and, when it is absent, compares `Origin` against the request host. An `Origin: null` without `Sec-Fetch-Site`, as sent by sandboxed iframes and some cross-origin redirect chains, is refused. Requests that carry neither header, such as those from non-browser clients, are still allowed, as are same-origin calls, user-initiated navigations, and no-JS form submissions. A separate origin that needs to call your backend should use an API route with explicit CORS.
