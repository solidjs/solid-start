---
"@solidjs/start": patch
---

fix: keep non-picked route exports that picked exports reference instead of deleting their bindings, so API handlers can call helpers exported from the same file (#2100); also fixes picked exports declared via `export { ... }` specifiers being dropped (#1659)
