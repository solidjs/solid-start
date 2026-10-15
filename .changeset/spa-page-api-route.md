---
"@solidjs/start": patch
---

Serve pages in SPA mode (`ssr: false`) when a route file exports both a page and an API handler, such as a `[...404].tsx` with a `GET`. The server treated those routes as API-only, so a `GET` that returned nothing gave a 404 for every URL the route matched.
