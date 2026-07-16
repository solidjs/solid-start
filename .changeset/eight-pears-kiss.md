---
"@solidjs/start": patch
---

The server function directives runtime is now internally accessed via package.json exports instead of relative paths, fixing inconsistencies in the file resolution. Also the server functions file inclusion/exclusion patterns can now be configured in the start plugin options via `serverFunctions`.
