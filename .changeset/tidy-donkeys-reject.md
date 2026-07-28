---
"@solidjs/start": patch
---

Reject server function calls when the response is a 5xx without an X-Error header, instead of resolving with the parsed error body
