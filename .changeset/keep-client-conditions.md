---
"@solidjs/start": patch
---

Keep Vite's default resolve conditions ("module", "browser") in the client environment: since 2.1.0, packages exposing a "browser" export condition (e.g. `@sentry/solidstart`) resolved to their Node build in the browser. The dev overlay's `@jridgewell/trace-mapping` is now pre-bundled, as the "browser" condition makes it import a UMD build.
