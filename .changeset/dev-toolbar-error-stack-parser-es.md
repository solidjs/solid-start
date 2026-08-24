---
"@solidjs/start": patch
---

Parse stack traces in the dev toolbar's error overlay with `error-stack-parser-es/lite` instead of `error-stack-parser`. The lite entry point is a much smaller, ESM-only parser that returns plain frame objects rather than class instances, and it no longer pulls in the `stackframe` package. Errors that carry no stack are now handled as an empty frame list instead of throwing.
