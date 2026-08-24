---
"@solidjs/start": patch
---

Don't emit route "reload" events during the initial file-system route scan. The scan runs on the first dev request, and the events invalidated the just-served routes manifest ~200ms later, pushing a spurious HMR update of the app/router module chain that raced hydration — intermittently duplicating pages, breaking client-side navigation, and detaching actions in dev.
