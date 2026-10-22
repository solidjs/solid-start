---
"@solidjs/start": minor
---

Add `serverFunctions.skewProtection`. When it is on, a page loaded before a deploy can no longer call the new server's functions with an outdated client. The server answers such a call with `409` instead of running the function, and the page reloads once to load the new version. Each build gets a random ID, or pass `{ buildId }` (such as a commit hash) when several machines build the same deploy. Only applies to production builds, and is off by default.
