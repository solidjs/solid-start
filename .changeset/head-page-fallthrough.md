---
"@solidjs/start": patch
---

Serve the page for a `HEAD` request when a route file exports both a page and a `GET` that returns nothing, such as a `[...404].tsx`. The server threw "did not return a response" and answered 500 instead of rendering the page as it does for `GET`.
