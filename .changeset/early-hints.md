---
"@solidjs/start": patch
---

Add an `earlyHints` option that sends the page's assets as `103 Early Hints`, so the browser can start downloading them while the server is still rendering. It covers the app's entry assets and the assets of the routes being rendered. On runtimes other than Node, the same hints are added as `Link` headers on the response. Off by default, and only applies to production builds.
