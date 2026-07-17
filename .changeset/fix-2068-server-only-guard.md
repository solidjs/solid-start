---
"@solidjs/start": patch
---

fix: fail loudly when client-reachable code imports `@solidjs/start`'s server-only entry points (`/http`, `/middleware`, `/config`) instead of silently shipping them to the browser, where they crashed hydration and broke unrelated actions/forms with no diagnostic (#2068)
