---
"@solidjs/start": patch
---

Apply cookies set on a returned or thrown response during single flight mutations. `redirect(to, { headers: { "Set-Cookie": ... } })` previously only reached the browser: the single flight re-render of the redirect target still ran with the old request cookies, so queries reading that cookie saw stale values. Those cookies are now merged into the request the re-render sees, matching what a browser round trip would have sent.
