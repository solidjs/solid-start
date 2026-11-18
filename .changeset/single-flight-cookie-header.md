---
"@solidjs/start": patch
---

Send the single-flight re-run request a single `; `-separated Cookie header with values kept as the browser sent them, so cookie parsers on Cloudflare Workers no longer read every cookie as one.
