---
"@solidjs/start": patch
---

This addresses an issue that could cause secret leaks.
When defining adding a `console.*` declaration, to a top-level `"use server"` module, the log would end up in the client-bundle.
