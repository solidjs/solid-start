---
"@solidjs/start": patch
---

Route module ids now end in the source extension, so ecosystem plugins apply inside `src/routes`.

Route files are imported through an id carrying the picked exports in the query (`routes/api.ts?pick=GET`), which left the id ending in the export name. Plugins whose filter is anchored on the file extension (`/\.[cm]?[jt]sx?$/`, the default for `unplugin-auto-import`, `unplugin-macros` and others) silently skipped every route file. The id now ends with a `lang.<ext>` marker, the same convention Vue SFCs use for `?vue&type=script&lang.ts`. Chunk filenames are unchanged.
