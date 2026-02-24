---
"@solidjs/start": patch
---

Fix a regression introduced in SolidStart v1.3.0 that could cause an infinite loop when a server function returns unexpected response (for example, S3/XML error responses).
