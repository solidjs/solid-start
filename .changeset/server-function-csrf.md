---
"@solidjs/start": patch
---

Reject cross-site server function requests to prevent CSRF.

A `"use server"` function could be invoked by another site with the visitor's cookies, over a GET or a form POST, because the request was not checked. Requests to server functions are now allowed only from the same origin or same site. The check trusts the `Sec-Fetch-Site` header and falls back to comparing `Origin` against the request host, so a cross-site page can no longer trigger a server function. Same-origin calls, user-initiated navigations, and no-JS form submissions are unaffected. A separate origin that needs to call your backend should use an API route with explicit CORS.
