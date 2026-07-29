---
"@solidjs/start": patch
---

Drop vite-plugin-solid's client-build-first `buildApp` ordering hooks, which Start's own `builder.buildApp` makes redundant. The pre-order hook built the client before nitro's own pre-order hook wiped `.output/`, so production builds shipped without client assets and the server rendered 500s from a manifest-less fallback.
