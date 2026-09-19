---
"@solidjs/start": patch
---

Stop a no-JS server function POST from returning a 500 when the body is not a form.

A POST to a server function without the client runtime, carrying an empty body or a non-form content type, left a value that is not a `FormData` as the last argument. Building the flash cookie called `.entries()` on it and threw, and the error handler rethrew the same way, so the request failed with a 500. The response is now the normal redirect, and the flash cookie is best effort so it can no longer take down the error path.
