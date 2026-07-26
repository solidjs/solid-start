---
"@solidjs/start": patch
---

Make route module ids end in the source extension so plugins like `unplugin-auto-import` and `unplugin-icons` apply inside `src/routes`.

Route files are requested with a `?pick=...` query so only the needed exports are bundled. Plugins that filter ids with an end-anchored extension regex (`/\.[jt]sx?$/`, the default for several `unplugin-*` packages) never matched those ids and silently skipped every route file. The query now ends with `&lang.<ext>`, following the same Vite sub-request convention `@vitejs/plugin-vue` uses.
