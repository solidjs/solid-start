---
"@solidjs/start": patch
---

Keep `@solidjs/start` out of server pre-bundling, so that server functions no longer fail with "invalid server function" in dev with plugins that pre-bundle server dependencies, such as the Cloudflare Vite plugin.
