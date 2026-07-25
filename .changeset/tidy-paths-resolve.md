---
"@solidjs/start": patch
---

Scope the built-in `~` alias to the app package, so files in other workspace packages can map `~` to their own root through an importer-aware plugin such as `vite-tsconfig-paths`. In stylesheets and asset URLs (CSS `@import`, `url()`, `new URL(..., import.meta.url)`) `~` still always means the app root, since Vite resolves those without running plugins.
