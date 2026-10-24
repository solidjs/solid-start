---
"@solidjs/start": patch
---

Keep the API route matcher out of the client bundle. It is only used on the server, but the client loaded it with the page routes, which added about 2.5 KB of unused code. Routes that only export an `OPTIONS` handler are now matched as API routes.
