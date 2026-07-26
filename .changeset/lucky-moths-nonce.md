---
"@solidjs/start": patch
---

Apply the configured `nonce` to the two script tags that were still missing it, so a strict `script-src` CSP no longer needs `unsafe-inline`:

- The client-side redirect that streaming mode emits after the shell has already flushed (`<script>window.location=...</script>`) now carries the nonce.
- The SPA entry script tag now carries the nonce, matching the SSR entry script.
