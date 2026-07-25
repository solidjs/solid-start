---
"@solidjs/start": patch
---

Fix TS2883/TS2742 when emitting declarations for `entry-server.tsx`. `createHandler` now returns `StartHandler`, a type owned by `@solidjs/start`, instead of h3's `H3`, so the inferred type of `export default createHandler(...)` no longer has to be named through a nested `node_modules/@solidjs/start/node_modules/h3` path.
