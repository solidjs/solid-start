---
"@solidjs/start": patch
---

Treat a server function request with `Origin: null` and no `Sec-Fetch-Site` as cross-site.

Browsers send `Origin: null` from opaque origins, such as sandboxed iframes and some cross-origin redirect chains. When `Sec-Fetch-Site` was absent, the handler skipped the `Origin` comparison for that value and allowed the request. It is now refused with a `403`. Requests that carry neither header, such as those from non-browser clients, are still allowed.
