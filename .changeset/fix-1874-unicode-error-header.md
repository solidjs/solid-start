---
"@solidjs/start": patch
---

fix: don't crash when a server function throws an error whose message contains non-latin1 characters. The message was assigned verbatim to the `X-Error` response header, and since header values must be ByteString-safe, a message like `"Ошибка 🚀"` made `Headers.set` throw inside the catch block — producing a bare 500 with no error propagated, so the client never threw and the route section hung empty instead of hitting the `ErrorBoundary`. The header value is now encoded when it contains such characters (the real error still travels in the serialized body). (#1874)
