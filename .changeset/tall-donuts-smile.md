---
"@solidjs/start": patch
---

Declare `@solidjs/router` as an optional peer dependency constrained to `>=0.16.0 <2.0.0-0`. Router v2 is expected to target Solid v2, so installing it alongside `@solidjs/start` v2 now surfaces a peer warning instead of silently producing an incompatible pairing. The peer is marked optional, so apps that do not use the router are unaffected.
