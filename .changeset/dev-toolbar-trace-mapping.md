---
"@solidjs/start": patch
---

Use `@jridgewell/trace-mapping` instead of `source-map-js` to resolve original sources in the dev toolbar's error overlay. It decodes mappings lazily, so only the positions actually inspected are resolved, it is significantly smaller in the browser bundle, and it understands indexed source maps.
