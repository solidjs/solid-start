---
"@solidjs/start": patch
---

Reload the browser when `entry-server` or the middleware changes in dev. Both are server-only, so Vite had nothing to send the browser and the page kept showing the previously rendered output until it was refreshed by hand.
