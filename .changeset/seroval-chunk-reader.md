---
"@solidjs/start": patch
---

Make reading server function streams safer and faster.

- A malformed chunk after the first one is now logged instead of causing an unhandled promise rejection. On hosts that do not catch unhandled rejections, one bad request could stop the server process.
- The stream is cancelled when a chunk cannot be read or parsed.
- Chunk headers are now checked strictly, and a server rejects chunks over 64MB that a client sends.
- Large payloads that arrive in many small pieces are read in linear time. A 16MB chunk read in 16KB pieces took about 2 seconds and now takes about 30ms.
