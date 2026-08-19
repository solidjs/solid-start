---
"@solidjs/start": patch
---

Declare an explicit `Content-Type: text/plain; charset=utf-8` on seroval-stream server function responses (success and error paths) so intermediaries cannot content-sniff a type onto them
