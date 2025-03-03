---
"@solidjs/start": patch
---

fix nested route with escaping resolved incorrectly (#1829).
before `/routes/nested/(ignored)route.tsx` resolved to `/nestedroute`
now it resolves to `/nested/route`.
