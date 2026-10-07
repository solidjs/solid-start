---
"@solidjs/start": patch
---

Reject server function argument values that are still pending when the request body ends.

A seroval request body can describe a promise or stream that it never settles. Such a value stayed pending forever, so a server function awaiting that argument never answered. Arguments are now decoded with seroval's cross-reference decoder, and once the body has been decoded every promise it left pending rejects with "Server function stream ended unexpectedly." and every stream it left open errors. Arguments the client serializes normally (promises, errors, async iterators, streams, `FormData`, `Request`, `Headers`, `URL` and the other supported values) decode as before. Decoded promises that nobody awaits no longer report unhandled rejections; code that awaits them still sees the rejection.
