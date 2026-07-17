---
"@solidjs/start": patch
---

fix: always pipe SSR output through a `TransformStream` in dev so h3 receives a standard `ReadableStream`. Returning the raw Solid stream only rendered on Node by accident; under Bun and Deno the response body was coerced to the literal string `[object Object]` (#2133)
