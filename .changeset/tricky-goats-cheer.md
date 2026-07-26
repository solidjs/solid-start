---
"@solidjs/start": patch
---

Stop the dev toolbar from reporting benign `ResizeObserver loop` notifications as application errors. Browsers dispatch these as window `error` events carrying no error object, so the toolbar was capturing the raw `ErrorEvent` and force-opening the error panel over the app on every resize.
