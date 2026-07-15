---
"@solidjs/start": patch
---

Fixed changes in route files resulting in a reload instead of hot module replace. Reloads now only are triggered when adding or removing routes.
