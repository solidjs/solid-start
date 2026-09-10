---
"@solidjs/start": patch
---

Only strip a whole `index` segment when mapping route files to paths. Route files whose names merely end in "index", such as `routes/reindex.tsx`, were previously served at `/re` instead of `/reindex`.
