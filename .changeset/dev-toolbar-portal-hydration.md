---
"@solidjs/start": patch
---

Fix the dev overlay corrupting the first client-side navigation after an SSR page load. The toolbar's `<Portal>` handed the hydrating tree a client-created marker node that hydration never inserts into the DOM, and that phantom bookkeeping entry made the first route swap orphan the previous page's DOM (both pages visible at once). The toolbar now renders in its own root outside the app tree, mounted only after the SSR stream completes, since rendering during streaming steals hydration keys from pending suspense chunks.
