---
"@solidjs/start": patch
---

Await asynchronous `serverFunctions.onError` handlers before serializing server function errors.
Preserve the original error if the handler throws or rejects.
