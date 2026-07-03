---
"@solidjs/start": patch
---

Fixed an issue where runtimes like AWS Lambda would default to `application/json` when no header was present, causing parsing errors in `json` serialization mode. To ensure consistent behavior, the `Content-Type` is now explicitly set to `text/plain`.
