---
"@solidjs/start": patch
---

adopt solid 2.0.0-beta.29's hoisted web APIs: `clientOnly` re-exports core's implementation (import-once dedupe, `{ lazy }`), `HttpStatusCode`/`HttpHeader` become thin deprecated wrappers over the `httpStatus`/`httpHeader` primitives, `getServerFunctionMeta` delegates to `getServerFunctionInvocation` (invocation state no longer rides on `event.locals`), the streaming handler consumes `renderToStream(...).readable` instead of a hand-rolled adapter, and the handler marks `response.committed` when the head can no longer change
