---
"@solidjs/start": patch
---

Report errors from lazily loaded route modules instead of hanging the SSR stream. A syntax error in a route (or anything it imports) made the module's dynamic import reject, which left its Suspense boundary pending forever: the response never finished and the browser was stuck on a blank page with no error shown. The failure now reaches the nearest `ErrorBoundary`, so the dev overlay displays it.
