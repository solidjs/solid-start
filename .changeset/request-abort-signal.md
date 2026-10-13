---
"@solidjs/start": patch
---

Make `event.request.signal` abort when the client disconnects on Node. The request was built without a signal tied to the connection, so it never aborted and API routes kept running after the client went away. On web runtimes the platform signal still applies.
