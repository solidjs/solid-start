---
"@solidjs/start": patch
---

Fix published package missing `dist/`: pnpm 11 respects `.gitignore` when packing a package without a `files` field, so `2.0.0-beta.1` was published without its build output. Add an explicit `files` field.
