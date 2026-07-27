---
"@solidjs/start": patch
---

Recover from SSR errors in dev without a manual refresh. A syntax error in `app.tsx` left the 500 page on screen for good, because the error page has no modules registered for HMR and so ignored the update that fixed the file. The dev server now adds a small script to SSR error pages that reloads them once the server renders again.
