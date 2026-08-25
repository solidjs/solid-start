---
"@solidjs/start": patch
---

Pre-bundle `@jridgewell/trace-mapping` for the client in dev so the dev overlay's lazily-loaded error viewer stops rejecting with `The requested module ... does not provide an export named 'default'`. The viewer's import chain is only reachable through `@solidjs/start` itself, so Vite's dep scanner never discovers it and served its CJS/UMD dependencies raw.
