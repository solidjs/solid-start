---
"@solidjs/start": patch
---

Restore the optional `routerLoad` third argument to `createHandler`, which primes custom routers (e.g. TanStack Router) on the server before SSR rendering. It was accidentally dropped in the v2 rewrite.
