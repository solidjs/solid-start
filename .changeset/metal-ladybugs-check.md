---
"@solidjs/start": patch
---

Move `getServerFunctionMeta` from `@solidjs/start/server` to `@solidjs/start` to fix circular import issues.

The old export at `@solidjs/start/server` still exists, but is **deprecated** and will be removed in a future release.
