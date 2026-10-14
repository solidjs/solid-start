---
"@solidjs/start": minor
---

Add `ssr: "data-only"`. The app renders on the client without hydration, as with `ssr: false`, but the server runs the requested page's route `preload`s and streams their query results with the HTML shell, so the client doesn't fetch that data again.
