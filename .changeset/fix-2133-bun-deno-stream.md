---
"@solidjs/start": patch
---

Return a cancellation-safe web `ReadableStream` for streaming SSR in development. Returning Solid's
raw stream only rendered on Node; Bun and Deno coerced it to `[object Object]`.
