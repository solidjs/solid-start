---
"@solidjs/start": patch
---

Reject cross-site server function requests.

A `"use server"` function could be invoked from another site with the visitor's cookies, over a GET or a form POST, because the request's origin was not checked. Requests to server functions are now allowed only from the same origin or same site. The check trusts the `Sec-Fetch-Site` header and falls back to comparing `Origin` against the request host, so a page on another site receives a `403` instead of running the function. Same-origin calls, user-initiated navigations, and no-JS form submissions are unaffected. A separate origin that needs to call your backend should use an API route with explicit CORS.
