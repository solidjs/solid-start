---
"@solidjs/start": patch
---

Settle server function values that are still waiting on the stream when its body ends.

A seroval body can reference a promise or stream that a later frame settles. If the body ended before that frame arrived, the value stayed pending forever, so a server function awaiting such an argument never answered. A malformed later frame also surfaced as an unhandled rejection. When the body ends or fails, every promise still waiting on it now rejects (with the failure, or with "Server function stream ended unexpectedly.") and every open stream errors. Decoded promises that nobody awaits no longer report unhandled rejections; code that awaits them still sees the rejection.
