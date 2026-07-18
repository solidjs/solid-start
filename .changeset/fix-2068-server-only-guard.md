---
"@solidjs/start": patch
---

fix: mark `@solidjs/start/http` and `@solidjs/start/middleware` as `server-only` so importing them from client-reachable code fails loudly at dev/build time, instead of silently shipping them to the browser where they crashed hydration and broke unrelated actions/forms with no diagnostic (#2068)
