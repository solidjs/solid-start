---
"@solidjs/start": patch
---

- fix vite config types - now you'll get better type suggestions for things like `vite.server.watch`.
- make the @solidjs/start package able to be consumed by projects that use `"moduleResolution": "nodenext"` by adding extensions to output .d.ts files.
