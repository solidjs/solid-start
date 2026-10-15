---
"@solidjs/start": patch
---

Reload the page once when a route's code fails to load during client-side navigation, such as when a deploy replaced it while the page was open. Before, the navigation ended on an error page until the user refreshed by hand. The page now reloads at the destination and loads the new version. A route that still fails right after the reload shows the error instead of reloading again. This only applies to production builds, and can be turned off with `reloadOnRouteChunkError: false`.
