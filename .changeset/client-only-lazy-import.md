---
"@solidjs/start": patch
---

Stop `client-only` from failing the build for lazily imported client components.

A module that imported `client-only` and was loaded through `clientOnly(() => import(...))` failed the server build, even though it only ever runs in the browser. The server build resolves every dynamic import to emit its chunk, so it resolved the `client-only` module and rejected it, though that module never runs on the server. `client-only` no longer fails the build. `server-only` is unchanged and still fails a client build.
