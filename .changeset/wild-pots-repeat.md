---
"@solidjs/start": patch
---

Don't send server error stack traces to the client in production builds. When a server function throws, the error is serialized and rethrown on the client, and seroval included `Error.prototype.stack` by default, leaking server file paths and internal function names. Stacks are still serialized in development.
